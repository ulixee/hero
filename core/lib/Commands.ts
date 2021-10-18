import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import SessionDb from '../dbs/SessionDb';

export default class Commands {
  public readonly history: ICommandMeta[] = [];
  public resumeCounter = 0;
  public get last(): ICommandMeta | undefined {
    if (this.history.length === 0) return;
    return this.history[this.history.length - 1];
  }

  public get lastId(): number {
    return this.last?.id;
  }

  public get length(): number {
    return this.history.length;
  }

  public nextCommandMeta: { commandId: number; startDate: Date; sendDate: Date };

  constructor(readonly db: SessionDb) {}

  public create(
    tabId: number,
    frameId: number,
    startNavigationId: number,
    commandName: string,
    args: any[],
  ): ICommandMeta {
    const commandMeta = {
      id: this.history.length + 1,
      tabId,
      frameId,
      name: commandName,
      args: args.length ? TypeSerializer.stringify(args) : undefined,
      run: this.resumeCounter,
      startNavigationId,
    } as ICommandMeta;

    if (this.nextCommandMeta) {
      const { commandId, sendDate, startDate } = this.nextCommandMeta;
      this.nextCommandMeta = null;
      commandMeta.id = commandId;
      commandMeta.clientSendDate = sendDate?.getTime();
      commandMeta.clientStartDate = startDate?.getTime();
    }
    return commandMeta;
  }

  public onStart(commandMeta: ICommandMeta, startDate: number): void {
    commandMeta.runStartDate = startDate;
    this.history.push(commandMeta);
    this.db.commands.insert(commandMeta);
  }

  public onFinished(commandMeta: ICommandMeta, result: any, endNavigationId: number): void {
    commandMeta.endDate = Date.now();
    commandMeta.result = result;
    commandMeta.endNavigationId = endNavigationId;
    this.db.commands.insert(commandMeta);
  }

  public getCommandForTimestamp(lastCommand: ICommandMeta, timestamp: number): ICommandMeta {
    let command = lastCommand;
    if (command.runStartDate <= timestamp && command.endDate > timestamp) {
      return command;
    }

    for (let i = this.history.length - 1; i >= 0; i -= 1) {
      command = this.history[i];
      if (command.runStartDate <= timestamp) break;
    }
    return command;
  }

  public reuseCommand<T>(commandMeta: ICommandMeta, reusableCommand: ICommandMeta): T {
    commandMeta.result = reusableCommand.result;
    commandMeta.endDate = reusableCommand.endDate;
    commandMeta.reusedCommandFromRun = reusableCommand.reusedCommandFromRun ?? reusableCommand.run;
    commandMeta.startNavigationId = reusableCommand.startNavigationId;
    commandMeta.endNavigationId = reusableCommand.endNavigationId;
    this.onStart(commandMeta, reusableCommand.runStartDate);
    return reusableCommand.result;
  }

  public findReusableCommandFromRun(
    resumeStartLocation: string,
    commandMeta: ICommandMeta,
    run: number,
  ): ICommandMeta {
    // don't use any cached commands if sessionStart
    if (!resumeStartLocation || resumeStartLocation === 'sessionStart') return;

    // make sure last command reused a command run
    const lastCommand = this.last;
    if (
      lastCommand &&
      lastCommand.run === commandMeta.run &&
      lastCommand.reusedCommandFromRun === undefined
    ) {
      return;
    }

    for (let i = this.history.length - 1; i >= 0; i -= 1) {
      const previous = this.history[i];
      if (previous.run < run) break;

      if (
        previous.run === run &&
        previous.id === commandMeta.id &&
        previous.tabId === commandMeta.tabId &&
        previous.args === commandMeta.args &&
        previous.name === commandMeta.name &&
        !previous.resultType?.includes('Error')
      ) {
        return previous;
      }
    }
  }
}
