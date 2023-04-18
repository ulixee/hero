import { IJsPath } from '@ulixee/js-path';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import Log from '@ulixee/commons/lib/Logger';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import DisconnectedError from '@ulixee/net/errors/DisconnectedError';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import ICommandCounter from '../interfaces/ICommandCounter';
import CallsiteLocator from './CallsiteLocator';

const { log } = Log(module);

type IListenerFn = (...args: any[]) => void;
type IInterceptorFn = (...args: any[]) => any;

export default class CoreEventHeap {
  private readonly connection: ConnectionToHeroCore;
  private readonly listenerFnById: Map<string, IListenerFn> = new Map();
  private readonly listenerIdByHandle: Map<string, string> = new Map();
  private readonly eventInterceptors: Map<string, IInterceptorFn[]> = new Map();
  private readonly meta: ISessionMeta;
  private readonly commandCounter: ICommandCounter;
  private pendingRegistrations: Promise<any> = Promise.resolve();
  private callsiteLocator: CallsiteLocator;

  constructor(
    meta: ISessionMeta | null,
    connection: ConnectionToHeroCore,
    commandCounter: ICommandCounter,
    callsiteLocator: CallsiteLocator,
  ) {
    this.meta = meta;
    this.connection = connection;
    this.commandCounter = commandCounter;
    this.callsiteLocator = callsiteLocator;
  }

  public hasEventInterceptors(type: string): boolean {
    return this.eventInterceptors.has(type);
  }

  public registerEventInterceptors(interceptors: { [type: string]: IInterceptorFn }): void {
    for (const [type, interceptor] of Object.entries(interceptors)) {
      const events = this.eventInterceptors.get(type) ?? [];
      events.push(interceptor);
      this.eventInterceptors.set(type, events);
    }
  }

  public async addListener(
    jsPath: IJsPath | null,
    type: string,
    listenerFn: (...args: any[]) => void,
    options?: any,
    extras?: Partial<ICoreCommandRequestPayload>,
  ): Promise<void> {
    const handle = this.generateListenerHandle(jsPath, type, listenerFn);
    if (this.listenerIdByHandle.has(handle)) return;

    extras ??= {};
    extras.callsite ??= this.callsiteLocator.getCurrent();

    const subscriptionPromise = this.connection.sendRequest({
      commandId: this.commandCounter.nextCommandId,
      meta: this.meta,
      startTime: Date.now(),
      command: 'Events.addEventListener',
      args: [jsPath, type, options],
      ...extras,
    });

    const registered = new Resolvable<void>();
    this.pendingRegistrations = this.pendingRegistrations.then(() => registered.promise);
    try {
      const response = await subscriptionPromise;
      const { listenerId } = response;

      const wrapped = this.wrapHandler(type, listenerFn);
      this.listenerFnById.set(listenerId, wrapped);
      this.listenerIdByHandle.set(handle, listenerId);
    } finally {
      registered.resolve();
    }
  }

  public removeListener(
    jsPath: IJsPath | null,
    type: string,
    listenerFn: (...args: any[]) => void,
    options?: any,
    extras?: Partial<ICoreCommandRequestPayload>,
  ): void {
    const handle = this.generateListenerHandle(jsPath, type, listenerFn);
    const listenerId = this.listenerIdByHandle.get(handle);
    if (!listenerId) return;

    extras ??= {};
    extras.callsite ??= this.callsiteLocator.getCurrent();

    this.connection
      .sendRequest({
        commandId: this.commandCounter.nextCommandId,
        meta: this.meta,
        startTime: Date.now(),
        command: 'Events.removeEventListener',
        args: [listenerId, options],
        ...extras,
      })
      .catch(error => {
        if (error instanceof DisconnectedError) return;
        log.warn('removeEventListener Error: ', { error, sessionId: this.meta?.sessionId });
      });
    this.listenerFnById.delete(listenerId);
    this.listenerIdByHandle.delete(handle);
  }

  public incomingEvent(meta: ISessionMeta, listenerId: string, eventArgs: any[]): void {
    let waitForPending = Promise.resolve();
    if (!this.listenerFnById.has(listenerId)) {
      waitForPending = this.pendingRegistrations;
    }
    waitForPending
      .then(() => {
        const listenerFn = this.listenerFnById.get(listenerId);
        if (listenerFn) listenerFn(...eventArgs);
        return null;
      })
      .catch(error => {
        log.error('incomingEvent Error: ', { error, sessionId: this.meta?.sessionId });
      });
  }

  private generateListenerHandle(
    jsPath: IJsPath | null,
    type: string,
    listenerFn: (...args: any[]) => void,
  ): string {
    const parts = [jsPath ? JSON.stringify(jsPath) : 'BASE'];
    parts.push(type);
    parts.push(listenerFn.toString());
    return parts.join(':');
  }

  private wrapHandler(
    type: string,
    listenerFn: (...args: any[]) => void,
  ): (...args: any[]) => void {
    if (!this.eventInterceptors.has(type)) return listenerFn;
    const interceptorFns = this.eventInterceptors.get(type);
    return (...args: any[]): void => {
      let processedArgs = args;
      for (const fn of interceptorFns) {
        let result = fn(...processedArgs);
        if (!Array.isArray(result)) result = [result];
        processedArgs = result;
      }
      listenerFn(...processedArgs);
    };
  }
}
