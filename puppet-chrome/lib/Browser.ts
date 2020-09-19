import { Protocol } from 'devtools-protocol';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { assert } from '@secret-agent/commons/utils';
import IBrowserEmulation from '@secret-agent/puppet/interfaces/IBrowserEmulation';
import { Connection } from './Connection';
import { BrowserContext } from './BrowserContext';
import { CDPSession } from './CDPSession';

interface IBrowserEvents {
  disconnected: void;
}

export class Browser extends TypedEventEmitter<IBrowserEvents> {
  public readonly browserContextsById = new Map<string, BrowserContext>();
  public readonly cdpSession: CDPSession;
  private readonly connection: Connection;
  private readonly closeCallback: () => void;

  constructor(connection: Connection, closeCallback: () => void) {
    super();
    this.connection = connection;
    this.cdpSession = connection.rootSession;
    this.closeCallback = closeCallback;

    this.connection.on('disconnected', this.emit.bind(this, 'disconnected'));
    this.cdpSession.on('Target.attachedToTarget', this.onAttachedToTarget.bind(this));
    this.cdpSession.on('Target.detachedFromTarget', this.onDetachedFromTarget.bind(this));
  }

  public async newContext(emulation: IBrowserEmulation): Promise<BrowserContext> {
    // Creates a new incognito browser context. This won't share cookies/cache with other browser contexts.
    const { browserContextId } = await this.cdpSession.send('Target.createBrowserContext', {
      disposeOnDetach: true,
    });
    return new BrowserContext(this, browserContextId, emulation);
  }

  public async close(): Promise<void> {
    const closePromises: Promise<any>[] = [];
    for (const [, context] of this.browserContextsById) closePromises.push(context.close());
    await Promise.all(closePromises);
    await this.closeCallback();
    this.connection.dispose();
  }

  public isConnected(): boolean {
    return !this.connection.isClosed;
  }

  protected async listen() {
    await this.cdpSession.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    });
    return this;
  }

  // NOTE: can't be async or browser contexts won't be populated
  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent) {
    const { targetInfo, sessionId } = event;

    assert(targetInfo.browserContextId, `targetInfo: ${JSON.stringify(targetInfo, null, 2)}`);

    if (targetInfo.type === 'page') {
      const cdpSession = this.connection.getSession(sessionId);
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      context.onPageAttached(cdpSession, targetInfo);
    }
  }

  private onDetachedFromTarget(payload: Protocol.Target.DetachedFromTargetEvent) {
    const targetId = payload.targetId;
    for (const [, context] of this.browserContextsById) {
      context.onPageDetached(targetId);
    }
  }

  public static async create(connection: Connection, closeCallback: () => void): Promise<Browser> {
    const browser = new Browser(connection, closeCallback);
    return await browser.listen();
  }
}
