import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ISessionMeta from '@secret-agent/interfaces/ISessionMeta';
import Log from '@secret-agent/commons/Logger';
import ConnectionToCore from '../connections/ConnectionToCore';

const { log } = Log(module);

type IListenerFn = (...args: any[]) => void;
type IInterceptorFn = (...args: any[]) => any;

export default class CoreEventHeap {
  private readonly connection: ConnectionToCore;
  private readonly listenerFnById: Map<string, IListenerFn> = new Map();
  private readonly listenerIdByHandle: Map<string, string> = new Map();
  private readonly eventInterceptors: Map<string, IInterceptorFn[]> = new Map();
  private readonly meta: ISessionMeta;
  private pendingRegistrations: Promise<any> = Promise.resolve();

  constructor(meta: ISessionMeta | null, connection: ConnectionToCore) {
    this.meta = meta;
    this.connection = connection;
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
    options?,
  ): Promise<void> {
    const handle = this.generateListenerHandle(jsPath, type, listenerFn);
    if (this.listenerIdByHandle.has(handle)) return;

    const subscriptionPromise = this.connection.sendRequest({
      meta: this.meta,
      startDate: new Date(),
      command: 'Session.addEventListener',
      args: [jsPath, type, options],
    });

    this.pendingRegistrations = this.pendingRegistrations.then(() => subscriptionPromise);

    const response = await subscriptionPromise;
    const { listenerId } = response.data;
    let wrapped = listenerFn;
    if (this.eventInterceptors.has(type)) {
      const interceptorFns = this.eventInterceptors.get(type);
      wrapped = (...args: any[]) => {
        let processedArgs = args;
        for (const fn of interceptorFns) {
          let result = fn(...processedArgs);
          if (!Array.isArray(result)) result = [result];
          processedArgs = result;
        }
        listenerFn(...processedArgs);
      };
    }

    this.listenerFnById.set(listenerId, wrapped);
    this.listenerIdByHandle.set(handle, listenerId);
  }

  public removeListener(
    jsPath: IJsPath | null,
    type: string,
    listenerFn: (...args: any[]) => void,
  ): void {
    const handle = this.generateListenerHandle(jsPath, type, listenerFn);
    const listenerId = this.listenerIdByHandle.get(handle);
    if (!listenerId) return;

    this.connection
      .sendRequest({
        meta: this.meta,
        startDate: new Date(),
        command: 'Session.removeEventListener',
        args: [listenerId],
      })
      .catch(error => {
        log.error('removeEventListener Error: ', { error, sessionId: this.meta?.sessionId });
      });
    this.listenerFnById.delete(listenerId);
    this.listenerIdByHandle.delete(handle);
  }

  public incomingEvent(meta: ISessionMeta, listenerId: string, eventArgs: any[]): void {
    this.pendingRegistrations
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
}
