import { IBoundLog } from '@ulixee/hero-interfaces/ILog';
import Log from '@ulixee/commons/Logger';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import TypeSerializer from '@ulixee/commons/TypeSerializer';
import Session from './Session';
import Tab from './Tab';
import FrameEnvironment from './FrameEnvironment';

const { log } = Log(module);
type AsyncFunc = (...args: any[]) => Promise<any>;

export default class CommandRecorder {
  public readonly fnNames = new Set<string>();
  private logger: IBoundLog;
  constructor(
    readonly owner: any,
    readonly session: Session,
    readonly tabId: number,
    readonly frameId: number,
    fns: AsyncFunc[],
  ) {
    for (const fn of fns) {
      owner[fn.name] = ((...args) => this.runCommandFn(fn, ...args)) as any;
      this.fnNames.add(fn.name);
    }
    this.logger = log.createChild(module, {
      tabId,
      sessionId: session.id,
      frameId,
    });
  }

  private async runCommandFn<T>(commandFn: AsyncFunc, ...args: any[]): Promise<T> {
    if (!this.fnNames.has(commandFn.name))
      throw new Error(`Unsupported function requested ${commandFn.name}`);

    const { session } = this;
    const sessionState = session.sessionState;
    const commandHistory = sessionState.commands;
    let tabId = this.tabId;
    const frameId = this.frameId;

    if (!tabId && args.length && args[0] instanceof Tab) {
      tabId = args[0].id;
    }

    const commandMeta = {
      id: commandHistory.length + 1,
      tabId,
      frameId,
      name: commandFn.name,
      args: args.length ? TypeSerializer.stringify(args) : undefined,
      run: session.resumeCounter,
      url: (
        session.getTab(tabId)?.frameEnvironmentsById.get(frameId) ??
        this.session.getLastActiveTab()?.mainFrameEnvironment
      )?.url,
    } as ICommandMeta;

    if (sessionState.nextCommandMeta) {
      const { commandId, sendDate, startDate } = sessionState.nextCommandMeta;
      sessionState.nextCommandMeta = null;
      commandMeta.id = commandId;
      commandMeta.clientSendDate = sendDate?.getTime();
      commandMeta.clientStartDate = startDate?.getTime();
    }

    if (commandMeta.run > 0 && this.fulfillCommandWithLastRun(commandMeta)) {
      return commandMeta.result;
    }

    const tab = session.getTab(tabId);
    tab?.willRunCommand(commandMeta);

    let frame: FrameEnvironment;
    if (frameId) {
      frame = tab.frameEnvironmentsById.get(frameId);
      frame.navigationsObserver.willRunCommand(commandMeta, commandHistory);
    }
    const id = this.logger.info('Command.run', commandMeta);

    let result: T;
    try {
      commandMeta.runStartDate = Date.now();
      sessionState.recordCommandStart(commandMeta);

      result = await commandFn.call(this.owner, ...args);
      return result;
    } catch (err) {
      result = err;
      throw err;
    } finally {
      commandMeta.endDate = Date.now();
      commandMeta.result = result;
      // NOTE: second insert on purpose -- it will do an update
      sessionState.recordCommandFinished(commandMeta);
      tab?.didRunCommand(commandMeta);
      this.logger.stats('Command.done', { result, parentLogId: id });
    }
  }

  private fulfillCommandWithLastRun(commandMeta: ICommandMeta): boolean {
    const { session } = this;
    const sessionState = session.sessionState;
    const commandHistory = sessionState.commands;
    const { tabId, frameId, id } = commandMeta;

    const { sessionResume } = session.options;
    if (!sessionResume) return;
    // don't use any cached commands if sessionStart
    if (sessionResume.startLocation === 'sessionStart') return;

    const startAtPageStart = sessionResume.startLocation === 'pageStart';
    const currentUrl = session.tabsById.get(tabId).frameEnvironmentsById.get(frameId)?.url;

    // make sure last command reused a command run
    const lastCommand = sessionState.lastCommand;
    if (
      lastCommand &&
      lastCommand.run === commandMeta.run &&
      lastCommand.reusedCommandFromRun === undefined
    ) {
      return false;
    }

    const lastRun = commandMeta.run - 1;
    for (let i = commandHistory.length - 1; i >= 0; i -= 1) {
      const previous = commandHistory[i];
      if (previous.run < lastRun) break;

      if (
        previous.run === lastRun &&
        previous.id === id &&
        previous.tabId === commandMeta.tabId &&
        previous.args === commandMeta.args &&
        previous.name === commandMeta.name &&
        !previous.resultType?.includes('Error')
      ) {
        // if page start, we should break if url is the same.
        // NOTE: this will not handle a flow that goes to the same url multiple times
        if (
          startAtPageStart &&
          currentUrl === previous.url &&
          commandMeta.name !== 'waitForLocation' // can't wait for location again here
        ) {
          break;
        }

        commandMeta.result = previous.result;
        commandMeta.runStartDate = previous.runStartDate;
        commandMeta.endDate = previous.endDate;
        commandMeta.reusedCommandFromRun = previous.reusedCommandFromRun ?? previous.run;
        commandMeta.url = previous.url;
        sessionState.recordCommandStart(commandMeta);
        return true;
      }
    }
    return false;
  }
}
