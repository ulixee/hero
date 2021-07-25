import { Protocol } from 'devtools-protocol';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { assert } from '@ulixee/commons/lib/utils';
import IPuppetBrowser from '@ulixee/hero-interfaces/IPuppetBrowser';
import Log from '@ulixee/commons/lib/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IBrowserEngine from '@ulixee/hero-interfaces/IBrowserEngine';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
import IProxyConnectionOptions from '@ulixee/hero-interfaces/IProxyConnectionOptions';
import { Connection } from './Connection';
import { BrowserContext } from './BrowserContext';
import { DevtoolsSession } from './DevtoolsSession';

interface IBrowserEvents {
  disconnected: void;
}
const { log } = Log(module);

export class Browser extends TypedEventEmitter<IBrowserEvents> implements IPuppetBrowser {
  public readonly browserContextsById = new Map<string, BrowserContext>();
  public readonly devtoolsSession: DevtoolsSession;
  public onDevtoolsAttached?: (session: DevtoolsSession) => Promise<any>;

  private readonly connection: Connection;

  private readonly closeCallback: () => void;

  constructor(connection: Connection, closeCallback: () => void) {
    super();
    this.connection = connection;
    this.devtoolsSession = connection.rootSession;
    this.closeCallback = closeCallback;

    this.connection.on('disconnected', this.emit.bind(this, 'disconnected'));
    this.devtoolsSession.on('Target.attachedToTarget', this.onAttachedToTarget.bind(this));
    this.devtoolsSession.on('Target.detachedFromTarget', this.onDetachedFromTarget.bind(this));
    this.devtoolsSession.on('Target.targetCreated', this.onTargetCreated.bind(this));
    this.devtoolsSession.on('Target.targetDestroyed', this.onTargetDestroyed.bind(this));
    this.devtoolsSession.on('Target.targetCrashed', this.onTargetCrashed.bind(this));
  }

  public async newContext(
    plugins: ICorePlugins,
    logger: IBoundLog,
    proxy?: IProxyConnectionOptions,
  ): Promise<BrowserContext> {
    const proxySettings = proxy?.address
      ? {
          proxyBypassList: '<-loopback>',
          proxyServer: proxy.address,
        }
      : {};
    // Creates a new incognito browser context. This won't share cookies/cache with other browser contexts.
    const { browserContextId } = await this.devtoolsSession.send('Target.createBrowserContext', {
      disposeOnDetach: true,
      ...proxySettings,
    });

    return new BrowserContext(this, plugins, browserContextId, logger, proxy);
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
    await this.devtoolsSession.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    });

    await this.devtoolsSession.send('Target.setDiscoverTargets', {
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
      const devtoolsSession = this.connection.getSession(sessionId);
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      context?.onPageAttached(devtoolsSession, targetInfo).catch(() => null);
      return;
    }

    if (targetInfo.type === 'shared_worker') {
      const devtoolsSession = this.connection.getSession(sessionId);
      const context = this.browserContextsById.get(targetInfo.browserContextId);
      context?.onSharedWorkerAttached(devtoolsSession, targetInfo).catch(() => null);
    }

    if (event.waitingForDebugger && targetInfo.type === 'service_worker') {
      const devtoolsSession = this.connection.getSession(sessionId);
      if (!devtoolsSession) return;
      devtoolsSession.send('Runtime.runIfWaitingForDebugger').catch(() => null);
    }

    if (
      targetInfo.type === 'other' &&
      targetInfo.url.startsWith('devtools://devtools') &&
      this.onDevtoolsAttached
    ) {
      const devtoolsSession = this.connection.getSession(sessionId);
      this.onDevtoolsAttached(devtoolsSession).catch(() => null);
      return;
    }

    if (event.waitingForDebugger && targetInfo.type === 'other') {
      const devtoolsSession = this.connection.getSession(sessionId);
      if (!devtoolsSession) return;
      // Ideally, detaching should resume any target, but there is a bug in the backend.
      devtoolsSession
        .send('Runtime.runIfWaitingForDebugger')
        .catch(() => null)
        .then(() => this.devtoolsSession.send('Target.detachFromTarget', { sessionId }))
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
    browserEngine: IBrowserEngine,
    closeCallback: () => void,
  ): Promise<Browser> {
    const browser = new Browser(connection, closeCallback);

    const version = await browser.devtoolsSession.send('Browser.getVersion');
    log.info('Browser.create', {
      ...version,
      executablePath: browserEngine.executablePath,
      desiredFullVersion: browserEngine.fullVersion,
      sessionId: null,
    });

    return await browser.listen();
  }
}
