import Response from 'awaited-dom/impl/official-klasses/Response';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { createResponse } from 'awaited-dom/impl/create';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { getRequestIdOrUrl } from './Request';
import Browser from './Browser';
import { getCoreTab } from './Tab';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';

export default class Fetcher {
  public static async fetch(
    browser: Browser,
    input: Request | string,
    init?: IRequestInit,
  ): Promise<Response> {
    const tabSession = getCoreTab(browser.activeTab);
    const requestInput = await getRequestIdOrUrl(input);
    const attachedState = await tabSession.fetch(requestInput, init);

    const awaitedOptions: IAwaitedOptions = { browser, coreTab: tabSession };
    const awaitedPath = new AwaitedPath().withAttachedId(attachedState.id);
    return createResponse(awaitedPath, awaitedOptions);
  }
}
