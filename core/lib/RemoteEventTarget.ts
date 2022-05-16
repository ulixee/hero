import { IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import Session from './Session';
import { IJsPath } from '@unblocked-web/js-path';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreEventPayload';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import Logger from '@ulixee/commons/lib/Logger';

const { log } = Logger(module);

export default class RemoteEventTarget {
  private listeners = new Set<string>();
  constructor(
    private session: Session,
    private target: IRemoteEventListener,
    private meta: ISessionMeta,
    private onCoreEvent: (event: ICoreEventPayload) => void,
  ) {
    this.emitCoreEvent = this.emitCoreEvent.bind(this);
  }

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
      this.emitCoreEvent,
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

  private emitCoreEvent(listenerId: string, ...eventArgs: any[]): void {
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
      listenerId,
      eventArgs,
      lastCommandId: this.session.commands.lastId,
    });
  }
}
