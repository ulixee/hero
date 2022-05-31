import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import Session from './Session';
import { IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import RemoteEventTarget from './RemoteEventTarget';

export default class RemoteEvents {
  private remoteTargets = new Map<IRemoteEventListener, RemoteEventTarget>();

  constructor(private session: Session, readonly onCoreEvent: (event: ICoreEventPayload) => void) {
    this.close = this.close.bind(this);
    session.once('closing', this.close);
  }

  public close(): void {
    this.session.off('closing', this.close);
    this.session = null;
    for (const target of this.remoteTargets.values()) {
      target.close();
    }
    this.remoteTargets.clear();
  }

  public getEventTarget(meta: ISessionMeta): RemoteEventTarget {
    const session = this.session;
    let target: IRemoteEventListener = session;

    const tab = session.getTab(meta.tabId);
    if (tab) target = tab;

    if (meta.frameId) {
      target = tab?.getFrameEnvironment(meta.frameId);
    }

    if (!this.remoteTargets.has(target)) {
      this.remoteTargets.set(
        target,
        new RemoteEventTarget(this.session, target, meta, this.onCoreEvent),
      );
    }
    return this.remoteTargets.get(target);
  }
}
