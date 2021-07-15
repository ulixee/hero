import { IBoundLog } from '@ulixee/hero-interfaces/ILog';
import Log from '@ulixee/commons/Logger';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import TypeSerializer from '@ulixee/commons/TypeSerializer';
import Session from './Session';
import Tab from './Tab';

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
    if (!this.fnNames.has(commandFn.name)) throw new Error(`Unsupported function requested ${commandFn.name}`);

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
    } as ICommandMeta;

    if (sessionState.nextCommandMeta) {
      const { commandId, sendDate, startDate } = sessionState.nextCommandMeta;
      sessionState.nextCommandMeta = null;
      commandMeta.id = commandId;
      commandMeta.clientSendDate = sendDate?.getTime();
      commandMeta.clientStartDate = startDate?.getTime();
    }

    if (frameId) {
      const tab = session.getTab(tabId);
      const frame = tab.frameEnvironmentsById.get(frameId);
      frame.navigationsObserver.willRunCommand(commandMeta, commandHistory);
    }
    const id = this.logger.info('Command.run', commandMeta);

    let result: T;
    try {
      commandMeta.runStartDate = new Date().getTime();
      sessionState.recordCommandStart(commandMeta);

      result = await commandFn.call(this.owner, ...args);
      return result;
    } catch (err) {
      result = err;
      throw err;
    } finally {
      commandMeta.endDate = new Date().getTime();
      commandMeta.result = result;
      // NOTE: second insert on purpose -- it will do an update
      sessionState.recordCommandFinished(commandMeta);
      this.logger.stats('Command.done', { result, parentLogId: id });
    }
  }
}
