import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreEventPayload';
import Session from './Session';
import RemoteEventListener from './RemoteEventListener';

export default class RemoteEvents {
  private childListenersByMetaKey = new Map<string, RemoteEventListener>();

  constructor(readonly onCoreEvent: (event: ICoreEventPayload) => void) {}

  public close(): void {
    for (const listener of this.childListenersByMetaKey.values()) {
      listener.close();
    }
  }

  public get(meta: ISessionMeta): RemoteEventListener {
    const { sessionId, tabId, frameId } = meta;
    const key = [sessionId, tabId, frameId].join('_');
    if (!this.childListenersByMetaKey.has(key)) {
      let target: any = Session.get(sessionId);

      const tab = Session.getTab(meta);
      if (tab) target = tab;

      if (frameId) {
        target = tab?.getFrameEnvironment(frameId);
      }

      this.childListenersByMetaKey.set(
        key,
        new RemoteEventListener(target, this.emitCoreEvent.bind(this, meta)),
      );
    }

    return this.childListenersByMetaKey.get(key);
  }

  private emitCoreEvent(meta: ISessionMeta, listenerId: string, ...eventArgs: any[]): void {
    this.onCoreEvent({
      meta,
      listenerId,
      eventArgs,
      lastCommandId: Session.get(meta.sessionId)?.sessionState.commands.length,
    });
  }
}
