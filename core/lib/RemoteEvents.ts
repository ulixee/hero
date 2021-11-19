import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreEventPayload';
import Session from './Session';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { ICommandableTarget } from './CommandRunner';
import { IRemoteEventListener } from '../interfaces/IRemoteEventListener';
import Logger from '@ulixee/commons/lib/Logger';

const { log } = Logger(module);

export default class RemoteEvents {
  constructor(readonly onCoreEvent: (event: ICoreEventPayload) => void) {}

  public getEventTarget(meta: ISessionMeta): IRemoteEventsTarget {
    const { sessionId, frameId } = meta;
    let target: IRemoteEventListener = Session.get(sessionId);

    const tab = Session.getTab(meta);
    if (tab) target = tab;

    if (frameId) {
      target = tab?.getFrameEnvironment(frameId);
    }
    const emitEvent = this.emitCoreEvent.bind(this, meta);

    return {
      isAllowedCommand(method: string): boolean {
        return method === 'addEventListener' || method === 'removeEventListener';
      },
      addEventListener(
        jsPath: IJsPath | null,
        type: string,
        options?: any,
      ): Promise<{ listenerId: string }> {
        return target.addRemoteEventListener(type, emitEvent, jsPath, options);
      },
      removeEventListener(listenerId: string, options?: any): Promise<void> {
        return target.removeRemoteEventListener(listenerId, options);
      },
    };
  }

  private emitCoreEvent(meta: ISessionMeta, listenerId: string, ...eventArgs: any[]): void {
    const session = Session.get(meta.sessionId);
    if (session?.isClosing) {
      if (session.commands.getRemoteEventListener(listenerId)?.type !== 'close') {
        log.stats('Canceling event broadcast. Session is closing', {
          sessionId: session.id,
          listenerId,
          meta,
        });
        return;
      }
    }
    this.onCoreEvent({
      meta,
      listenerId,
      eventArgs,
      lastCommandId: session?.commands.lastId,
    });
  }
}

interface IRemoteEventsTarget extends ICommandableTarget {
  addEventListener(
    jsPath: IJsPath | null,
    type: string,
    options?: any,
  ): Promise<{ listenerId: string }>;
  removeEventListener(listenerId: string, options?: any): Promise<void>;
}
