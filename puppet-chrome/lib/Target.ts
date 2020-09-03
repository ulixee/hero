import { Protocol } from 'devtools-protocol';
import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { Page } from './Page';
import { CDPSession } from '../process/CDPSession';
import { Browser } from './Browser';
import { IFrameEvents } from './Frames';

export class Target extends TypedEventEmitter<ITargetEvents> {
  private targetInfo: Protocol.Target.TargetInfo;

  private readonly browser: Browser;

  private pageInitialized?: IResolvablePromise<Page>;

  private readonly _page: Promise<Page> | null = null;

  constructor(
    targetInfo: Protocol.Target.TargetInfo,
    browser: Browser,
    sessionFactory: () => Promise<CDPSession>,
  ) {
    super();
    this.browser = browser;

    this.targetInfo = targetInfo;
    if (targetInfo.type === 'page') {
      this.pageInitialized = createPromise();
      this._page = this.pageInitialized.promise
        .then(() => sessionFactory())
        .then(client => Page.create(client, this));
    }
  }

  public isPage() {
    return this.targetInfo.type === 'page';
  }

  public get page(): Promise<Page | null> {
    return this._page;
  }

  /**
   * Get the target that opened this target. Top-level targets return `null`.
   */
  public get opener(): Target | null {
    const { openerId } = this.targetInfo;
    if (!openerId) return null;
    return this.browser.targetsById.get(openerId);
  }

  public targetInfoChanged(targetInfo: Protocol.Target.TargetInfo) {
    this.targetInfo = targetInfo;

    if (this.isPage() && this.targetInfo.url !== '') {
      this.pageInitialized.resolve();
      this.onInitialized(true).catch(() => {
        // no op
      });
    }
  }

  public destroy() {
    this.pageInitialized?.reject(new Error('Target destroyed'));
  }

  private async onInitialized(didSucceed: boolean) {
    if (!didSucceed) return;

    const thisPage = await this.page;
    if (thisPage) return;

    const openerPage = await this.opener?.page;
    if (!openerPage) return;

    openerPage.onChildPage(thisPage);
  }
}

export interface ITargetEvents extends IFrameEvents {
  close: undefined;
}

export type TargetType =
  | 'page'
  | 'background_page'
  | 'service_worker'
  | 'shared_worker'
  | 'other'
  | 'browser'
  | 'webview';
