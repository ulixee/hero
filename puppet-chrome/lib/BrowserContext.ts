import { EventEmitter } from 'events';
import { assert } from '@secret-agent/commons/utils';
import IPuppetContext from '@secret-agent/puppet/interfaces/IPuppetContext';
import { IPuppetPage } from '@secret-agent/puppet/interfaces/IPuppetPage';
import IBrowserEmulation from '@secret-agent/puppet/interfaces/IBrowserEmulation';
import { Page } from './Page';
import { Browser } from './Browser';

export class BrowserContext extends EventEmitter implements IPuppetContext {
  public emulation: IBrowserEmulation;
  private readonly browser: Browser;
  private readonly id: string;

  constructor(browser: Browser, contextId: string, emulation: IBrowserEmulation) {
    super();
    this.browser = browser;
    this.id = contextId;
    this.emulation = emulation;
    this.browser.browserContextsById.set(this.id, this);
  }

  getPageForNetworkId(networkId: string): IPuppetPage {
    for (const [id, page] of this.browser.pagesById) {
      if (id === networkId) return page;
      if (page.workersById.has(id)) return page;
    }
  }

  public async newPage(): Promise<Page> {
    const { targetId } = await this.browser.cdpSession.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: this.id,
    });
    // chrome 80 still needs you to manually attach
    if (!this.browser.pagesById.has(targetId)) {
      await this.browser.cdpSession.send('Target.attachToTarget', {
        targetId,
        flatten: true,
      });
    }

    const page = this.browser.pagesById.get(targetId);
    await page.isReady;
    if (page.isClosed) throw new Error('Page has been closed.');
    return page;
  }

  public async close(): Promise<void> {
    if (!this.browser.cdpSession.isConnected()) return;
    assert(this.id, 'Non-incognito profiles cannot be closed!');

    await this.browser.cdpSession.send('Target.disposeBrowserContext', {
      browserContextId: this.id,
    });
    this.browser.browserContextsById.delete(this.id);
  }
}
