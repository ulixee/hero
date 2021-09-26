import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import Session from './Session';
import Tab from './Tab';
import { ICommandableTarget } from './CommandRunner';

const { log } = Log(module);
type AsyncFunc = (...args: any[]) => Promise<any> | any;

export default class CommandRecorder {
  public readonly fnNames = new Set<string>();
  private logger: IBoundLog;
  constructor(
    readonly owner: ICommandableTarget,
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

    const tab = session.getTab(tabId);
    const frame =
      tab?.getFrameEnvironment(frameId) ?? this.session.getLastActiveTab()?.mainFrameEnvironment;

    const commandMeta = {
      id: commandHistory.length + 1,
      tabId,
      frameId,
      name: commandFn.name,
      args: args.length ? TypeSerializer.stringify(args) : undefined,
      run: session.resumeCounter,
      startNavigationId: frame?.navigations?.top?.id,
    } as ICommandMeta;

    if (sessionState.nextCommandMeta) {
      const { commandId, sendDate, startDate } = sessionState.nextCommandMeta;
      sessionState.nextCommandMeta = null;
      commandMeta.id = commandId;
      commandMeta.clientSendDate = sendDate?.getTime();
      commandMeta.clientStartDate = startDate?.getTime();
    }

    if (commandMeta.run > 0) {
      const reusableCommand = this.findReusableCommandFromRun(commandMeta, commandMeta.run - 1);

      let isReusable = !!reusableCommand;
      if (isReusable && 'canReuseCommand' in this.owner) {
        isReusable = await this.owner.canReuseCommand(commandMeta, reusableCommand);
      }
      if (isReusable) {
        return this.reuseCommand(commandMeta, reusableCommand);
      }
    }

    tab?.willRunCommand(commandMeta);

    if (frame) {
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
      const mainFrame = frame ?? (tab ?? this.session.getLastActiveTab())?.mainFrameEnvironment;
      commandMeta.endNavigationId = mainFrame?.navigations?.top?.id;
      // NOTE: second insert on purpose -- it will do an update
      sessionState.recordCommandFinished(commandMeta);
      tab?.didRunCommand(commandMeta);
      this.logger.stats('Command.done', { result, parentLogId: id });
    }
  }

  private reuseCommand<T>(commandMeta: ICommandMeta, reusableCommand: ICommandMeta): T {
    commandMeta.result = reusableCommand.result;
    commandMeta.runStartDate = reusableCommand.runStartDate;
    commandMeta.endDate = reusableCommand.endDate;
    commandMeta.reusedCommandFromRun = reusableCommand.reusedCommandFromRun ?? reusableCommand.run;
    commandMeta.startNavigationId = reusableCommand.startNavigationId;
    commandMeta.endNavigationId = reusableCommand.endNavigationId;
    this.session.sessionState.recordCommandStart(commandMeta);
    return reusableCommand.result;
  }

  private findReusableCommandFromRun(commandMeta: ICommandMeta, run: number): ICommandMeta {
    const { session } = this;
    const sessionState = session.sessionState;
    const commandHistory = sessionState.commands;
    const { tabId, frameId, id } = commandMeta;

    const { sessionResume } = session.options;
    if (!sessionResume) return;
    // don't use any cached commands if sessionStart
    if (sessionResume.startLocation === 'sessionStart') return;

    const startAtPageStart = sessionResume.startLocation === 'pageStart';
    const breakAtNavigationId =
      sessionResume.startNavigationId ??
      session.tabsById.get(tabId)?.getFrameEnvironment(frameId)?.navigations?.top?.id;

    // make sure last command reused a command run
    const lastCommand = sessionState.lastCommand;
    if (
      lastCommand &&
      lastCommand.run === commandMeta.run &&
      lastCommand.reusedCommandFromRun === undefined
    ) {
      return;
    }

    for (let i = commandHistory.length - 1; i >= 0; i -= 1) {
      const previous = commandHistory[i];
      if (previous.run < run) break;

      if (
        previous.run === run &&
        previous.id === id &&
        previous.tabId === commandMeta.tabId &&
        previous.args === commandMeta.args &&
        previous.name === commandMeta.name &&
        !previous.resultType?.includes('Error')
      ) {
        // if page start, we should break if command ends in the navigation we want to restart is the same.
        if (
          startAtPageStart &&
          breakAtNavigationId === previous.startNavigationId &&
          commandMeta.name !== 'waitForLocation' // can't wait for location again here
        ) {
          break;
        }

        return previous;
      }
    }
  }
}
