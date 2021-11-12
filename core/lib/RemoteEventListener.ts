import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { assert } from '@ulixee/commons/lib/utils';
import Session from './Session';
import { ICommandableTarget } from './CommandRunner';
import Tab from './Tab';
import CommandRecorder from './CommandRecorder';
import FrameEnvironment from './FrameEnvironment';

export interface ITrigger {
  meta: ISessionMeta;
  listenerId: string;
  eventArgs: any[];
}

export interface IListenerObject {
  type?: string;
  jsPath?: IJsPath;
  listenFn?: (...args) => void;
}

export default class RemoteEventListener implements ICommandableTarget {
  private readonly listenersById = new Map<string, IListenerObject>();
  private listenerId = 0;
  private commandRecorder: CommandRecorder;

  constructor(
    readonly target: Session | Tab | FrameEnvironment,
    readonly emitEvent: (listenerId: string, ...eventArgs: any[]) => void,
  ) {
    let session: Session;
    let tabId: number;
    let frameId: number;
    if (target instanceof Session) {
      session = target;
    } else if (target instanceof Tab) {
      session = target.session;
      tabId = target.tabId;
    } else if (target instanceof FrameEnvironment) {
      session = target.session;
      tabId = target.tab.id;
      frameId = target.id;
    }
    this.commandRecorder = new CommandRecorder(this, session, tabId, frameId, [
      this.addEventListener,
      this.removeEventListener,
    ]);
  }

  public isAllowedCommand(method: string): boolean {
    return this.commandRecorder.fnNames.has(method);
  }

  public close(): void {
    for (const [id, entry] of this.listenersById) {
      if (entry.type !== 'close') {
        void this.removeEventListener(id);
      }
    }
  }

  public async addEventListener(
    jsPath: IJsPath | null,
    type: string,
    options?: any,
  ): Promise<{ listenerId: string }> {
    assert(type, 'Must provide a listener type');
    const listenerId = String((this.listenerId += 1));
    const listener: IListenerObject = {
      type,
      jsPath,
      listenFn: this.emitEvent.bind(this, listenerId),
    };
    this.listenersById.set(listenerId, listener);

    const target = this.target;

    if (jsPath && 'addJsPathEventListener' in target) {
      const fn = target.addJsPathEventListener.bind(target);
      await fn(type as any, jsPath, options, listener.listenFn);
    } else if ('on' in target) {
      const fn = target.on.bind(target) as any;
      fn(type, listener.listenFn);
    }

    return { listenerId };
  }

  public removeEventListener(id: string, options?: any): Promise<void> {
    const listener = this.listenersById.get(id);
    this.listenersById.delete(id);
    if (!listener) return;

    const { type, listenFn, jsPath } = listener;
    const target = this.target;
    if (!type) return Promise.resolve();

    if (jsPath && 'removeJsPathEventListener' in target) {
      const fn = target.removeJsPathEventListener.bind(target);
      fn(type as any, jsPath, listenFn, options);
    } else if ('off' in target) {
      const fn = target.off.bind(target) as any;
      fn(type, listenFn);
    }
    return Promise.resolve();
  }
}
