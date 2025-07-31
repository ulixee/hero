import { IJsPath } from '@ulixee/js-path';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import Session from './Session';
import { IRemoteEventListener } from '../interfaces/IRemoteEventListener';
export default class RemoteEventTarget {
    private session;
    private target;
    private meta;
    private onCoreEvent;
    private listeners;
    constructor(session: Session, target: IRemoteEventListener, meta: ISessionMeta, onCoreEvent: (event: ICoreListenerPayload) => void);
    close(): void;
    isAllowedCommand(method: string): boolean;
    addEventListener(jsPath: IJsPath | null, type: string, options?: any): Promise<{
        listenerId: string;
    }>;
    removeEventListener(listenerId: string, options?: any): Promise<void>;
    private emitCoreEvent;
}
