import { IJsPath } from "awaited-dom/base/AwaitedPath";
import ISessionMeta from "@secret-agent/core-interfaces/ISessionMeta";
import Log from "@secret-agent/commons/Logger";
import CoreClient from "./CoreClient";

const { log } = Log(module);

type IListenerFn = (...args: any[]) => void;
type IInterceptorFn = (...args: any[]) => any[];

export default class CoreEventHeap {
  private readonly coreClient: CoreClient;
  private readonly listenerFnById: Map<string, IListenerFn> = new Map();
  private readonly listenerIdByHandle: Map<string, string> = new Map();
  private readonly eventInterceptors: Map<string, IInterceptorFn[]> = new Map();
  private readonly meta: ISessionMeta;

  constructor(meta: ISessionMeta | null, coreClient: CoreClient) {
    this.meta = meta;
    this.coreClient = coreClient;
  }

  public hasEventInterceptors(type: string) {
    return this.eventInterceptors.has(type);
  }

  public registerEventInterceptor(type: string, interceptor: IInterceptorFn) {
    const events = this.eventInterceptors.get(type) ?? [];
    events.push(interceptor);
    this.eventInterceptors.set(type, events);
  }

  public async addListener(
    jsPath: IJsPath | null,
    type: string,
    listenerFn: (...args: any[]) => void,
    options?,
  ): Promise<void> {
    const handle = this.generateListenerHandle(jsPath, type, listenerFn);
    if (this.listenerIdByHandle.has(handle)) return;

    const {
      data: { listenerId },
    } = await this.coreClient.pipeOutgoingCommand(this.meta, 'addEventListener', [
      jsPath,
      type,
      options,
    ]);

    let wrapped = listenerFn;
    if (this.eventInterceptors.has(type)) {
      const interceptorFns = this.eventInterceptors.get(type);
      wrapped = (...args: any[]) => {
        let processedArgs = args;
        for (const fn of interceptorFns) {
          processedArgs = fn(...processedArgs);
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
  ) {
    const handle = this.generateListenerHandle(jsPath, type, listenerFn);
    const listenerId = this.listenerIdByHandle.get(handle);
    if (!listenerId) return;

    this.coreClient
      .pipeOutgoingCommand(this.meta, 'removeEventListener', [listenerId])
      .catch(error => {
        log.error('removeEventListener Error: ', { error, sessionId: this.meta?.sessionId });
      });
    this.listenerFnById.delete(listenerId);
    this.listenerIdByHandle.delete(handle);
  }

  public incomingEvent(meta: ISessionMeta, listenerId: string, eventArgs: any[]) {
    const listenerFn = this.listenerFnById.get(listenerId);
    if (!listenerFn) return;
    listenerFn(...eventArgs);
  }

  private generateListenerHandle(
    jsPath: IJsPath | null,
    type: string,
    listenerFn: (...args: any[]) => void,
  ) {
    const parts = [jsPath ? JSON.stringify(jsPath) : 'BASE'];
    parts.push(type);
    parts.push(listenerFn.toString());
    return parts.join(':');
  }
}
