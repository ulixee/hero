import { Protocol } from 'devtools-protocol';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { assert } from './assert';
import { Target } from './Target';
import { Connection } from '../process/Connection';
import { BrowserContext } from './BrowserContext';

type BrowserCloseCallback = () => Promise<void> | void;

interface IBrowserEvents {
  disconnected: void;
}

export class Browser extends TypedEventEmitter<IBrowserEvents> {
  public targetsById = new Map<string, Target>();

  private readonly connection: Connection;
  private readonly closeCallback: BrowserCloseCallback;

  constructor(connection: Connection, closeCallback: BrowserCloseCallback) {
    super();
    this.connection = connection;
    this.closeCallback = closeCallback;

    this.connection.on('disconnected', this.emit.bind(this, 'disconnected'));
    this.connection.on('Target.targetCreated', this.targetCreated.bind(this));
    this.connection.on('Target.targetDestroyed', this.targetDestroyed.bind(this));
    this.connection.on('Target.targetInfoChanged', this.targetInfoChanged.bind(this));
  }

  /**
   * Creates a new incognito browser context. This won't share cookies/cache with other
   * browser contexts.
   */
  public async createIncognitoBrowserContext(): Promise<BrowserContext> {
    const { browserContextId } = await this.connection.send('Target.createBrowserContext', {
      disposeOnDetach: true,
    });
    return new BrowserContext(this.connection, this, browserContextId);
  }

  public async close(): Promise<void> {
    await this.closeCallback.call(null);
    this.connection.dispose();
  }

  public isConnected(): boolean {
    return !this.connection.isClosed;
  }

  private async targetCreated(event: Protocol.Target.TargetCreatedEvent): Promise<void> {
    const targetInfo = event.targetInfo;
    const target = new Target(targetInfo, this, () => this.connection.createSession(targetInfo));
    assert(
      !this.targetsById.has(targetInfo.targetId),
      'Target should not exist before targetCreated',
    );
    this.targetsById.set(targetInfo.targetId, target);
  }

  private async targetDestroyed(event: { targetId: string }): Promise<void> {
    const target = this.targetsById.get(event.targetId);
    target.destroy();
    this.targetsById.delete(event.targetId);
    await target.emit('close');
  }

  private async targetInfoChanged(event: Protocol.Target.TargetInfoChangedEvent) {
    const target = this.targetsById.get(event.targetInfo.targetId);
    assert(target, 'target should exist before targetInfoChanged');
    target.targetInfoChanged(event.targetInfo);
  }

  public static async create(
    connection: Connection,
    closeCallback: BrowserCloseCallback,
  ): Promise<Browser> {
    const browser = new Browser(connection, closeCallback);
    await connection.send('Target.setDiscoverTargets', { discover: true });
    return browser;
  }
}
