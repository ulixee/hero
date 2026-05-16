import { IJsPath } from '@ulixee/js-path';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import ICommandCounter from '../interfaces/ICommandCounter';
import CallsiteLocator from './CallsiteLocator';
type IInterceptorFn = (...args: any[]) => any;
export default class CoreEventHeap {
    private readonly connection;
    private readonly listenerFnById;
    private readonly listenerIdByHandle;
    private readonly eventInterceptors;
    private readonly meta;
    private readonly commandCounter;
    private pendingRegistrations;
    private callsiteLocator;
    constructor(meta: ISessionMeta | null, connection: ConnectionToHeroCore, commandCounter: ICommandCounter, callsiteLocator: CallsiteLocator);
    hasEventInterceptors(type: string): boolean;
    registerEventInterceptors(interceptors: {
        [type: string]: IInterceptorFn;
    }): void;
    addListener(jsPath: IJsPath | null, type: string, listenerFn: (...args: any[]) => void, options?: any, extras?: Partial<ICoreCommandRequestPayload>): Promise<void>;
    removeListener(jsPath: IJsPath | null, type: string, listenerFn: (...args: any[]) => void, options?: any, extras?: Partial<ICoreCommandRequestPayload>): void;
    incomingEvent(meta: ISessionMeta, listenerId: string, eventArgs: any[]): void;
    private generateListenerHandle;
    private wrapHandler;
}
export {};
