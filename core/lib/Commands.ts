import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import { IJsPath } from '@unblocked-web/js-path';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ICommandMarker from '@unblocked-web/agent/interfaces/ICommandMarker';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import { IRemoteEmitFn } from '../interfaces/IRemoteEventListener';
import { IEventRecord } from '../models/AwaitedEventsTable';
import SessionDb from '../dbs/SessionDb';

export type ICommandPresetMeta = Pick<
  ICoreCommandRequestPayload,
  | 'startTime'
  | 'sendTime'
  | 'activeFlowHandlerId'
  | 'flowCommandId'
  | 'commandId'
  | 'callsite'
  | 'retryNumber'
>;

export default class Commands
  extends TypedEventEmitter<{
    start: ICommandMeta;
    finish: ICommandMeta;
    pause: void;
    resume: void;
  }>
  implements ICommandMarker
{
  public readonly history: ICommandMeta[] = [];

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

  // holder - will be cleared out to work around async
  public presetMeta: ICommandPresetMeta;

  private listenersById = new Map<string, IRemoteListenerDetails>();
  private listenerIdCounter = 0;
  private commandLockPromise: Resolvable<void>;
  private defaultWaitForLocationCommandId = 0;

  constructor(readonly db: SessionDb) {
    super();
  }

  public getStartingCommandIdFor(marker: 'waitForLocation'): number {
    if (marker === 'waitForLocation') {
      return this.defaultWaitForLocationCommandId;
    }
  }

  public waitForCommandLock(): Promise<void> {
    return this.commandLockPromise?.promise;
  }

  public pause(): void {
    if (!this.commandLockPromise || this.commandLockPromise.isResolved) {
      this.commandLockPromise = new Resolvable();
    }
    this.emit('pause');
  }

  public resume(): void {
    this.commandLockPromise.resolve();
    this.commandLockPromise = null;
    this.emit('resume');
  }

  public create(
    tabId: number,
    frameId: number,
    startNavigationId: number,
    commandName: string,
    args: any[],
    presetCommandMeta: ICommandPresetMeta,
  ): ICommandMeta {
    const commandMeta = {
      id: this.history.length + 1,
      tabId,
      frameId,
      name: commandName,
      retryNumber: 0,
      args: args.length ? TypeSerializer.stringify(args) : undefined,
      startNavigationId,
    } as ICommandMeta;

    if (presetCommandMeta) {
      const {
        commandId,
        startTime,
        sendTime,
        callsite,
        retryNumber,
        activeFlowHandlerId,
        flowCommandId,
      } = presetCommandMeta;
      if (commandId) commandMeta.id = commandId;
      commandMeta.clientSendDate = sendTime;
      commandMeta.clientStartDate = startTime;
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
    this.history.sort((a, b) => {
      if (a.id === b.id) return a.retryNumber - b.retryNumber;
      return a.id - b.id;
    });
    this.db.commands.insert(commandMeta);
    this.emit('start', commandMeta);
  }

  public willRunCommand(newCommand: ICommandMeta): void {
    // if this is a goto, set this to the "waitForLocation(change/reload)" command marker
    if (newCommand.name === 'goto') {
      this.defaultWaitForLocationCommandId = newCommand.id;
    }
    // handle cases like waitForLocation two times in a row
    if (!newCommand.name.startsWith('waitFor') || newCommand.name === 'waitForLocation') {
      // find the last "waitFor" command that is not followed by another waitFor
      const last = this.last;
      if (last && last.name.startsWith('waitFor') && last.name !== 'waitForMillis') {
        this.defaultWaitForLocationCommandId = newCommand.id;
      }
    }
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
      publishedAtCommandId: this.lastId,
      tabId,
      frameId,
      listenerId,
      eventArgs,
    };
    this.db.awaitedEvents.insert(event);
  }
}

interface IRemoteListenerDetails {
  id: string;
  listenFn: (...eventArgs: any[]) => any;
  type: string;
  jsPath?: IJsPath;
}
