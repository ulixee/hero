import { IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import Session from './Session';
import { IJsPath } from '@unblocked-web/js-path';
import ICoreListenerPayload from '@ulixee/hero-interfaces/ICoreListenerPayload';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import Logger from '@ulixee/commons/lib/Logger';

const { log } = Logger(module);

export default class RemoteEventTarget {
  private listeners = new Set<string>();
  constructor(
    private session: Session,
    private target: IRemoteEventListener,
    private meta: ISessionMeta,
    private onCoreEvent: (event: ICoreListenerPayload) => void,
  ) {}

  close(): void {
    for (const id of this.listeners) {
      void this.target.removeRemoteEventListener(id);
    }
  }

  isAllowedCommand(method: string): boolean {
    return method === 'addEventListener' || method === 'removeEventListener';
  }

  async addEventListener(
    jsPath: IJsPath | null,
    type: string,
    options?: any,
  ): Promise<{ listenerId: string }> {
    const result = await this.target.addRemoteEventListener(
      type,
      this.emitCoreEvent.bind(this, type),
      jsPath,
      options,
    );
    this.listeners.add(result.listenerId);
    return result;
  }

  removeEventListener(listenerId: string, options?: any): Promise<void> {
    this.listeners.delete(listenerId);
    return this.target.removeRemoteEventListener(listenerId, options);
  }

  private emitCoreEvent(eventType: string, listenerId: string, ...data: any[]): void {
    if (this.session?.isClosing) {
      if (this.session.commands.getRemoteEventListener(listenerId)?.type !== 'close') {
        log.stats('Canceling event broadcast. Session is closing', {
          sessionId: this.session.id,
          listenerId,
          meta: this.meta,
        });
        return;
      }
    }

    this.onCoreEvent({
      meta: this.meta,
      eventType,
      listenerId,
      data,
      lastCommandId: this.session.commands.lastId,
    });
  }
}
