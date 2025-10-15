import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import Session from './Session';
import RemoteEventTarget from './RemoteEventTarget';
export default class RemoteEvents {
    private session;
    readonly onCoreEvent: (event: ICoreEventPayload) => void;
    private remoteTargets;
    constructor(session: Session, onCoreEvent: (event: ICoreEventPayload) => void);
    close(): void;
    getEventTarget(meta: ISessionMeta): RemoteEventTarget;
}
