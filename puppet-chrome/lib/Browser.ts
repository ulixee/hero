import { Protocol } from 'devtools-protocol';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { assert } from './assert';
import { Connection } from '../process/Connection';
import { BrowserContext } from './BrowserContext';
import { Page } from './Page';
import { CDPSession } from '../process/CDPSession';
import { debugError } from "./Utils";

type BrowserCloseCallback = () => Promise<void> | void;

interface IBrowserEvents {
  disconnected: void;
}

export class Browser extends TypedEventEmitter<IBrowserEvents> {
  public readonly browserContextsById = new Map<string, BrowserContext>();
  public readonly pagesById = new Map<string, Page>();
  public readonly cdpSession: CDPSession;
  private readonly connection: Connection;
  private readonly closeCallback: BrowserCloseCallback;

  constructor(connection: Connection, closeCallback: BrowserCloseCallback) {
    super();
    this.connection = connection;
    this.cdpSession = connection.rootSession;
    this.closeCallback = closeCallback;

    this.connection.on('disconnected', this.emit.bind(this, 'disconnected'));
    this.cdpSession.on('Target.attachedToTarget', this.onAttachedToTarget.bind(this));
    this.cdpSession.on('Target.detachedFromTarget', this.onDetachedFromTarget.bind(this));
  }

  /**
   * Creates a new incognito browser context. This won't share cookies/cache with other
   * browser contexts.
   */
  public async newContext(): Promise<BrowserContext> {
    const { browserContextId } = await this.cdpSession.send('Target.createBrowserContext', {
      disposeOnDetach: true,
    });
    return new BrowserContext(this, browserContextId);
  }

  public async close(): Promise<void> {
    await this.closeCallback.call(null);
    this.connection.dispose();
  }

  public isConnected(): boolean {
    return !this.connection.isClosed;
  }

  // NOTE: can't be async!
  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent) {
    const { targetInfo, sessionId } = event;

    assert(targetInfo.browserContextId, `targetInfo: ${JSON.stringify(targetInfo, null, 2)}`);

    if (targetInfo.type === 'page' && !this.pagesById.has(targetInfo.targetId)) {
      const cdpSession = this.connection.getSession(sessionId);
      const context = this.browserContextsById.get(targetInfo.browserContextId);

      const opener = targetInfo.openerId ? this.pagesById.get(targetInfo.openerId) || null : null;
      const page = new Page(cdpSession, targetInfo.targetId, context, opener);
      this.pagesById.set(targetInfo.targetId, page);
    }
  }

  private onDetachedFromTarget(payload: Protocol.Target.DetachedFromTargetEvent) {
    const targetId = payload.targetId!;
    const page = this.pagesById.get(targetId);
    if (page) {
      this.pagesById.delete(targetId);
      page.didClose();
    }
  }

  public static async create(
    connection: Connection,
    closeCallback: BrowserCloseCallback,
  ): Promise<Browser> {
    const browser = new Browser(connection, closeCallback);
    const cdpSession = connection.rootSession;
    await cdpSession.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    });

    return browser;
  }
}
