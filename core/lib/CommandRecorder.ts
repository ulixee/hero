import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import Session from './Session';
import Tab from './Tab';
import { ICommandableTarget } from './CommandRunner';

const { log } = Log(module);
type AsyncFunc = (...args: any[]) => Promise<any>;

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
    const commands = session.commands;

    let tabId = this.tabId;
    const frameId = this.frameId;

    if (!tabId && args.length && args[0] instanceof Tab) {
      tabId = args[0].id;
    }

    const tab = session.getTab(tabId);
    const frame =
      tab?.getFrameEnvironment(frameId) ?? this.session.getLastActiveTab()?.mainFrameEnvironment;

    const commandMeta = commands.create(
      tabId,
      frameId,
      frame?.navigations?.top?.id,
      commandFn.name,
      args,
    );

    if (commandMeta.run > 0) {
      const sessionResumeLocation = session.options.sessionResume?.startLocation;
      const reusableCommand = commands.findReusableCommandFromRun(
        sessionResumeLocation,
        commandMeta,
        commandMeta.run - 1,
      );

      let isReusable = !!reusableCommand;
      if (isReusable && 'canReuseCommand' in this.owner) {
        isReusable = await this.owner.canReuseCommand(commandMeta, reusableCommand);
      }
      if (isReusable) {
        return commands.reuseCommand(commandMeta, reusableCommand);
      }
    }

    tab?.willRunCommand(commandMeta);

    if (frame) {
      frame.navigationsObserver.willRunCommand(commandMeta, commands.history);
    }
    const id = this.logger.info('Command.run', commandMeta);

    let result: T;
    try {
      commands.onStart(commandMeta, Date.now());

      result = await commandFn.call(this.owner, ...args);
      return result;
    } catch (err) {
      result = err;
      throw err;
    } finally {
      const mainFrame = frame ?? (tab ?? this.session.getLastActiveTab())?.mainFrameEnvironment;
      commands.onFinished(commandMeta, result, mainFrame?.navigations?.top?.id);
      tab?.didRunCommand(commandMeta);
      this.logger.stats('Command.done', { result, parentLogId: id });
    }
  }
}
