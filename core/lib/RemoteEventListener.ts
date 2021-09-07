import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { assert } from '@ulixee/commons/lib/utils';
import Session from './Session';
import { ICommandableTarget } from './CommandRunner';
import Tab from './Tab';

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

  constructor(
    readonly target: Session | Tab,
    readonly emitEvent: (listenerId: string, ...eventArgs: any[]) => void,
  ) {}

  public isAllowedCommand(method: string): boolean {
    return method === 'addEventListener' || method === 'removeEventListener';
  }

  public close() {
    for (const [id, entry] of this.listenersById) {
      if (entry.type !== 'close') {
        this.removeEventListener(id);
      }
    }
  }

  public addEventListener(
    jsPath: IJsPath | null,
    type: string,
    options?: any,
  ): { listenerId: string } {
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
      fn(type as any, jsPath, options, listener.listenFn);
    } else if ('on' in target) {
      const fn = target.on.bind(target) as any;
      fn(type, listener.listenFn);
    }

    return { listenerId };
  }

  public removeEventListener(id: string): void {
    const listener = this.listenersById.get(id);
    this.listenersById.delete(id);

    const { type, listenFn, jsPath } = listener;
    const target = this.target;
    if (!type) return;

    if (jsPath && 'removeJsPathEventListener' in target) {
      const fn = target.removeJsPathEventListener.bind(target);
      fn(type as any, jsPath, listenFn);
    } else if ('off' in target) {
      const fn = target.off.bind(target) as any;
      fn(type, listenFn);
    }
  }
}
