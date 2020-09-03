import { EventEmitter } from 'events';
import { Connection } from '../process/Connection';
import { Page } from './Page';
import { assert } from './assert';
import { Browser } from './Browser';

export class BrowserContext extends EventEmitter {
  private connection: Connection;
  private browser: Browser;
  private readonly id: string;

  constructor(connection: Connection, browser: Browser, contextId: string) {
    super();
    this.connection = connection;
    this.browser = browser;
    this.id = contextId;
  }

  async newPage(): Promise<Page> {
    const { targetId } = await this.connection.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: this.id,
    });
    const target = this.browser.targetsById.get(targetId);
    return target.page;
  }

  async close(): Promise<void> {
    if (this.connection.isClosed) return;
    assert(this.id, 'Non-incognito profiles cannot be closed!');

    await this.connection.send('Target.disposeBrowserContext', {
      browserContextId: this.id || undefined,
    });
  }
}
