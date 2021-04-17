import { Protocol } from 'devtools-protocol';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { assert } from '@secret-agent/commons/utils';
import IBrowserEmulationSettings from '@secret-agent/puppet-interfaces/IBrowserEmulationSettings';
import IPuppetBrowser from '@secret-agent/puppet-interfaces/IPuppetBrowser';
import Log from '@secret-agent/commons/Logger';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
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
    this.cdpSession.on('Target.targetCreated', this.onTargetCreated.bind(this));
    this.cdpSession.on('Target.targetDestroyed', this.onTargetDestroyed.bind(this));
    this.cdpSession.on('Target.targetCrashed', this.onTargetCrashed.bind(this));
  }

  public async newContext(
    emulation: IBrowserEmulationSettings,
    logger: IBoundLog,
  ): Promise<BrowserContext> {
    // Creates a new incognito browser context. This won't share cookies/cache with other browser contexts.
    const { browserContextId } = await this.cdpSession.send('Target.createBrowserContext', {
      disposeOnDetach: true,
      proxyBypassList: '<-loopback>',
      proxyServer: emulation.proxyAddress,
    });

    return new BrowserContext(this, browserContextId, emulation, logger);
  }

  public async getFeatures(): Promise<{
    supportsPerBrowserContextProxy: boolean;
    version: { major: string; minor: string };
  }> {
    const protocol = await this.connection.getProtocol();
    const targetProtocol = protocol.domains.find(x => x.domain === 'Target');
    const createBrowserContext = targetProtocol.commands.find(
      x => x.name === 'createBrowserContext',
    );
    const supportsProxy =
      createBrowserContext?.parameters?.some(x => x.name === 'proxyServer') ?? false;

    return {
      supportsPerBrowserContextProxy: supportsProxy,
      version: protocol.version,
    };
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
      waitForDebuggerOnStart: true,
      flatten: true,
    });

    await this.cdpSession.send('Target.setDiscoverTargets', {
      discover: true,
    });

    return this;
  }

  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent) {
    const { targetInfo, sessionId } = event;

    if (!targetInfo.browserContextId) {
      assert(targetInfo.browserContextId, `targetInfo: ${JSON.stringify(targetInfo, null, 2)}`);
    }

    if (targetInfo.type === 'page') {
      const cdpSession = this.connection.getSession(sessionId);
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      context?.onPageAttached(cdpSession, targetInfo);
      return;
    }

    if (targetInfo.type === 'shared_worker') {
      const cdpSession = this.connection.getSession(sessionId);
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      context?.onSharedWorkerAttached(cdpSession, targetInfo).catch(() => null);
    }

    if (event.waitingForDebugger && targetInfo.type === 'service_worker') {
      const cdpSession = this.connection.getSession(sessionId);
      if (!cdpSession) return;
      cdpSession.send('Runtime.runIfWaitingForDebugger').catch(() => null);
    }
    if (event.waitingForDebugger && targetInfo.type === 'other') {
      const cdpSession = this.connection.getSession(sessionId);
      if (!cdpSession) return;
      // Ideally, detaching should resume any target, but there is a bug in the backend.
      cdpSession
        .send('Runtime.runIfWaitingForDebugger')
        .catch(() => null)
        .then(() => this.cdpSession.send('Target.detachFromTarget', { sessionId }))
        .catch(() => null);
    }
  }

  private async onTargetCreated(event: Protocol.Target.TargetCreatedEvent) {
    const { targetInfo } = event;
    if (targetInfo.type === 'page' && !targetInfo.attached) {
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      await context?.attachToTarget(targetInfo.targetId);
    }
    if (targetInfo.type === 'shared_worker') {
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      await context?.attachToWorker(targetInfo);
    }
  }

  private onTargetDestroyed(event: Protocol.Target.TargetDestroyedEvent) {
    const { targetId } = event;
    for (const context of this.browserContextsById.values()) {
      context.targetDestroyed(targetId);
    }
  }

  private onTargetCrashed(event: Protocol.Target.TargetCrashedEvent) {
    const { targetId, errorCode, status } = event;
    if (status === 'killed') {
      for (const context of this.browserContextsById.values()) {
        context.targetKilled(targetId, errorCode);
      }
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
    engine: IBrowserEngine,
    closeCallback: () => void,
  ): Promise<Browser> {
    const browser = new Browser(connection, closeCallback);

    const version = await browser.cdpSession.send('Browser.getVersion');
    log.info('Browser.create', {
      ...version,
      executablePath: engine.executablePath,
      desiredFullVersion: engine.fullVersion,
      sessionId: null,
    });

    return await browser.listen();
  }
}
