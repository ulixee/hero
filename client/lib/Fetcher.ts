import Response from 'awaited-dom/impl/official-klasses/Response';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { createResponse } from 'awaited-dom/impl/create';
import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import CoreClientSession from './CoreClientSession';
import Browser from './Browser';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { getRequestIdOrUrl } from './Request';

interface IState {
  awaitedPath: AwaitedPath;
  coreClientSession: CoreClientSession;
  browser: Browser;
}

const { getState, setState } = StateMachine<any, IState>();

export default class Fetcher {
  constructor(browser: Browser, coreClientSession: CoreClientSession) {
    initializeConstantsAndProperties(this, [], []);
    setState(this, {
      browser: browser,
      coreClientSession: coreClientSession,
    });
  }

  public async fetch(input: Request | string, init?: IRequestInit): Promise<Response> {
    const state = getState(this);
    const coreClientSession = state.coreClientSession as CoreClientSession;
    const awaitedOptions = { browser: state.browser, coreClientSession: coreClientSession };

    const requestInput = await getRequestIdOrUrl(input);
    const attachedState = await coreClientSession.fetch(requestInput, init);
    const awaitedPath = new AwaitedPath().withAttachedId(attachedState.id);
    const response = createResponse(awaitedPath, awaitedOptions);
    setState(response, {
      attachedState,
    });
    return response;
  }
}

// CREATE

export function createFetcher(browser: Browser, coreClientSession: CoreClientSession): Fetcher {
  return new Fetcher(browser, coreClientSession);
}
