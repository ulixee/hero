import { Protocol } from 'devtools-protocol';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { assert } from '@secret-agent/commons/utils';
import IBrowserEmulationSettings from '@secret-agent/puppet-interfaces/IBrowserEmulationSettings';
import IPuppetBrowser from '@secret-agent/puppet-interfaces/IPuppetBrowser';
import Log from '@secret-agent/commons/Logger';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import { Connection } from './Connection';
import { BrowserContext } from './BrowserContext';
import { CDPSession } from './CDPSession';

interface IBrowserEvents {
  disconnected: void;
}
const { log } = Log(module);

export class Browser extends TypedEventEmitter<IBrowserEvents> implements IPuppetBrowser {
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

  public async newContext(
    emulation: IBrowserEmulationSettings,
    logger: IBoundLog,
  ): Promise<BrowserContext> {
    // Creates a new incognito browser context. This won't share cookies/cache with other browser contexts.
    const { browserContextId } = await this.cdpSession.send('Target.createBrowserContext', {
      disposeOnDetach: true,
    });
    return new BrowserContext(this, browserContextId, emulation, logger);
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

  protected async listen(needsTargetDiscovery = false) {
    await this.cdpSession.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: needsTargetDiscovery,
      flatten: true,
    });

    if (needsTargetDiscovery) {
      // NOTE: only needed for < Chrome 83 to detect popups!!
      await this.cdpSession.send('Target.setDiscoverTargets', {
        discover: true,
      });
      this.cdpSession.on('Target.targetCreated', this.onTargetCreated.bind(this));
      this.cdpSession.on('Target.targetDestroyed', this.onTargetDestroyed.bind(this));
    }
    return this;
  }

  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent) {
    const { targetInfo, sessionId } = event;

    assert(targetInfo.browserContextId, `targetInfo: ${JSON.stringify(targetInfo, null, 2)}`);

    if (targetInfo.type === 'page') {
      const cdpSession = this.connection.getSession(sessionId);
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      context?.onPageAttached(cdpSession, targetInfo);
    }

    if (event.waitingForDebugger) {
      log.error('Browser.attachedToTarget.waitingForDebugger', {
        event,
        sessionId: null,
      });
      throw new Error('Attached to target waiting for debugger!');
    }
  }

  private async onTargetCreated(event: Protocol.Target.TargetCreatedEvent) {
    const { targetInfo } = event;
    if (targetInfo.type === 'page') {
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      await context.attachToTarget(targetInfo.targetId);
    }
  }

  private onTargetDestroyed(event: Protocol.Target.TargetDestroyedEvent) {
    const { targetId } = event;
    for (const context of this.browserContextsById.values()) {
      context.targetDestroyed(targetId);
    }
  }

  private onDetachedFromTarget(payload: Protocol.Target.DetachedFromTargetEvent) {
    const targetId = payload.targetId;
    for (const [, context] of this.browserContextsById) {
      context.onPageDetached(targetId);
    }
  }

  public static async create(
    connection: Connection,
    revision: string,
    closeCallback: () => void,
  ): Promise<Browser> {
    const browser = new Browser(connection, closeCallback);

    const needsTargetDiscovery = revision === '722234';

    return await browser.listen(needsTargetDiscovery);
  }
}
