import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import SessionDb from '../dbs/SessionDb';
import { IEventRecord } from '../models/AwaitedEventsTable';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';

import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';

export default class Commands extends TypedEventEmitter<{
  start: ICommandMeta;
  finish: ICommandMeta;
}> {
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

  public requiresScriptRestart = false;

  public nextCommandMeta: {
    commandId: number;
    startDate: Date;
    sendDate: Date;
    callsite?: ISourceCodeLocation[];
    retryNumber?: number;
    activeFlowHandlerId?: number;
    flowCommandId?: number;
  };

  private eventLogByRun = new Map<number, IEventRecord[]>();
  private listenersById = new Map<string, IRemoteListenerDetails>();
  private listenerIdCounter = 0;

  constructor(readonly db: SessionDb) {
    super();
  }

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
      retryNumber: 0,
      args: args.length ? TypeSerializer.stringify(args) : undefined,
      run: this.resumeCounter,
      startNavigationId,
    } as ICommandMeta;

    if (this.nextCommandMeta) {
      const {
        commandId,
        sendDate,
        startDate,
        callsite,
        retryNumber,
        activeFlowHandlerId,
        flowCommandId,
      } = this.nextCommandMeta;
      this.nextCommandMeta = null;
      if (commandId) commandMeta.id = commandId;
      commandMeta.clientSendDate = sendDate?.getTime();
      commandMeta.clientStartDate = startDate?.getTime();
      commandMeta.callsite = callsite;
      commandMeta.retryNumber = retryNumber;
      commandMeta.activeFlowHandlerId = activeFlowHandlerId;
      commandMeta.flowCommandId = flowCommandId;
    }
    return commandMeta;
  }

  public onStart(commandMeta: ICommandMeta, startDate: number): void {
    commandMeta.runStartDate = startDate;
    this.history.push(commandMeta);
    this.db.commands.insert(commandMeta);
    this.emit('start', commandMeta);
  }

  public onFinished(commandMeta: ICommandMeta, result: any, endNavigationId: number): void {
    commandMeta.endDate = Date.now();
    commandMeta.result = result;
    commandMeta.endNavigationId = endNavigationId;
    this.db.commands.insert(commandMeta);
    this.emit('finish', commandMeta);
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

  public reuseCommand<T>(
    commandMeta: ICommandMeta,
    reusableCommand: ICommandMeta,
    rawArgs: any[],
  ): T {
    commandMeta.result = reusableCommand.result;
    commandMeta.endDate = reusableCommand.endDate;
    commandMeta.reusedCommandFromRun = reusableCommand.reusedCommandFromRun ?? reusableCommand.run;
    commandMeta.startNavigationId = reusableCommand.startNavigationId;
    commandMeta.endNavigationId = reusableCommand.endNavigationId;
    this.onStart(commandMeta, reusableCommand.runStartDate);

    if (commandMeta.name === 'addRemoteEventListener') {
      const args = rawArgs as Parameters<IRemoteEventListener['addRemoteEventListener']>;
      this.rebindListener(
        commandMeta.result.listenerId,
        args[1],
        commandMeta.tabId,
        commandMeta.frameId,
      );
    }
    if (this.eventLogByRun.has(commandMeta.run - 1)) {
      setImmediate(this.rebroadcastEventsAtCommand.bind(this, commandMeta.id, commandMeta.run));
    }
    return reusableCommand.result;
  }

  public doesUnreusableCommandRequireRestart(
    resumeStartLocation: ISessionCreateOptions['sessionResume']['startLocation'],
    unreusableCommand: ICommandMeta,
  ): boolean {
    if (resumeStartLocation === 'sessionStart') return false;

    const priorRun = unreusableCommand.run - 1;
    let lastIdFromPriorRun = 0;
    for (const command of this.history) {
      if (command.run === priorRun) {
        // don't count the shutting down command
        if (command.name === 'close') break;

        lastIdFromPriorRun = command.id;
      }
    }
    const isAddonToScript = unreusableCommand.id > lastIdFromPriorRun;
    if (isAddonToScript) return false;

    this.requiresScriptRestart = true;

    return true;
  }

  public findReusableCommandFromRun(
    resumeStartLocation: ISessionCreateOptions['sessionResume']['startLocation'],
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
        previous.callsite === commandMeta.callsite &&
        !previous.resultType?.includes('Error')
      ) {
        return previous;
      }
    }
  }

  public observeRemoteEvents(
    type: string,
    emitFn: IRemoteEmitFn,
    jsPath?: IJsPath,
    tabId?: number,
    frameId?: number,
  ): IRemoteListenerDetails {
    const id = String((this.listenerIdCounter += 1));
    const details: IRemoteListenerDetails = {
      id,
      listenFn: this.onRemoteEvent.bind(this, id, emitFn, tabId, frameId),
      type,
      jsPath,
    };
    this.listenersById.set(id, details);
    return details;
  }

  public rebindListener(id: string, emitFn: IRemoteEmitFn, tabId?: number, frameId?: number): void {
    this.listenersById.get(id).listenFn = this.onRemoteEvent.bind(this, id, emitFn, tabId, frameId);
  }

  public getRemoteEventListener(listenerId: string): IRemoteListenerDetails {
    return this.listenersById.get(listenerId);
  }

  private onRemoteEvent(
    listenerId: string,
    listenFn: IRemoteEmitFn,
    tabId: number,
    frameId: number,
    ...eventArgs: any[]
  ): void {
    listenFn(listenerId, ...eventArgs);
    const event = <IEventRecord>{
      timestamp: Date.now(),
      run: this.resumeCounter,
      publishedAtCommandId: this.lastId,
      tabId,
      frameId,
      listenerId,
      eventArgs,
    };
    this.db.awaitedEvents.insert(event);

    if (!this.eventLogByRun.has(event.run)) this.eventLogByRun.set(event.run, []);
    this.eventLogByRun.get(event.run).push(event);
  }

  private rebroadcastEventsAtCommand(commandId: number, run: number): void {
    for (const event of this.eventLogByRun.get(run - 1) ?? []) {
      if (commandId === event.publishedAtCommandId) {
        const details = this.listenersById.get(event.listenerId);
        if (details) {
          details.listenFn(...event.eventArgs);
        }
      }
    }
  }
}

interface IRemoteListenerDetails {
  id: string;
  listenFn: (...eventArgs: any[]) => any;
  type: string;
  jsPath?: IJsPath;
}
