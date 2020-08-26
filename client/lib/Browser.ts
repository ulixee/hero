import SuperDocument from 'awaited-dom/impl/super-klasses/SuperDocument';
import Response from 'awaited-dom/impl/official-klasses/Response';
import { createSuperDocument } from 'awaited-dom/impl/create';
import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ILocationTrigger } from '@secret-agent/core-interfaces/Location';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import ISessionOptions from '@secret-agent/core-interfaces/ISessionOptions';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Request from 'awaited-dom/impl/official-klasses/Request';
import { bindFunctions } from '@secret-agent/commons/utils';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import IInteractions, { IMousePosition, ITypeInteraction } from '../interfaces/IInteractions';
import CoreClient from './CoreClient';
import CoreClientSession from './CoreClientSession';
import Resource, { createResource } from './Resource';
import WebsocketResource from './WebsocketResource';
import ScriptInstance from './ScriptInstance';
import User, { createUser } from './User';
import Fetcher, { createFetcher } from './Fetcher';
import ICreateBrowserOptions from '../interfaces/ICreateBrowserOptions';
import AwaitedEventTarget from './AwaitedEventTarget';
import IBrowser from '../interfaces/IBrowser';
import RequestGenerator from './Request';
import IWaitForResourceFilter from "../interfaces/IWaitForResourceFilter";

const { getState, setState } = StateMachine<IBrowser, IState>();
const scriptInstance = new ScriptInstance();

interface IState {
  coreClientSession: CoreClientSession;
  sessionName: string;
  superDocument: SuperDocument;
  user: User;
  isClosing: boolean;
  fetcher: Fetcher;
}

interface IEventType {
  close: Browser;
  resource: Resource | WebsocketResource;
}

const propertyKeys: (keyof Browser)[] = [
  'document',
  'sessionId',
  'sessionName',
  'user',
  'url',
  'cookies',
  'lastCommandId',
  'Request',
];

export default class Browser extends AwaitedEventTarget<IEventType> implements IBrowser {
  constructor(coreClientSession: CoreClientSession, sessionName: string) {
    super();
    initializeConstantsAndProperties(this, [], propertyKeys);
    const awaitedPath = new AwaitedPath('document');
    const awaitedOptions = { browser: this, coreClientSession };

    setState(this, {
      coreClientSession,
      sessionName,
      superDocument: createSuperDocument<IAwaitedOptions>(awaitedPath, awaitedOptions),
      user: createUser(this, coreClientSession),
      fetcher: createFetcher(this, coreClientSession),
      isClosing: false,
    });

    if (!coreClientSession.eventHeap.hasEventInterceptors('resource')) {
      coreClientSession.eventHeap.registerEventInterceptor(
        'resource',
        (resource: IResourceMeta) => {
          return [createResource(resource, coreClientSession)];
        },
      );
    }

    bindFunctions(this);
  }

  public get cookies(): Promise<ICookie[]> {
    return getState(this).coreClientSession.getPageCookies();
  }

  public get document(): SuperDocument {
    return getState(this).superDocument;
  }

  public get Request(): typeof Request {
    const coreClientSession = getState(this).coreClientSession;
    return RequestGenerator(coreClientSession);
  }

  public get user(): User {
    return getState(this).user;
  }

  public get url(): Promise<string> {
    return getState(this).coreClientSession.getUrl();
  }

  public get sessionId(): string {
    const { coreClientSession } = getState(this);
    return coreClientSession.sessionId;
  }

  public get sessionName(): string {
    return getState(this).sessionName;
  }

  public get lastCommandId(): number {
    return getState(this).coreClientSession.commandQueue.lastCommandId;
  }

  // METHODS

  public fetch(request: Request | string, init?: IRequestInit): Promise<Response> {
    return getState(this).fetcher.fetch(request, init);
  }

  public async close(): Promise<void> {
    const { isClosing, coreClientSession } = getState(this);
    if (isClosing) return;
    setState(this, { isClosing: true });
    await coreClientSession.close();
  }

  public async getJsValue(path: string): Promise<any> {
    return getState(this).coreClientSession.getJsValue(path);
  }

  public async configure(options: ISessionOptions): Promise<void> {
    await getState(this).coreClientSession.configure(options);
  }

  // METHODS THAT DELEGATE TO USER

  public async goto(href: string) {
    return this.user.goto(href);
  }

  public async click(mousePosition: IMousePosition) {
    return this.user.click(mousePosition);
  }

  public async interact(...interactions: IInteractions) {
    return this.user.interact(...interactions);
  }

  public async type(...typeInteractions: ITypeInteraction[]) {
    return this.user.type(...typeInteractions);
  }

  public async waitForAllContentLoaded() {
    return this.user.waitForAllContentLoaded();
  }

  public async waitForResource(filter: IWaitForResourceFilter, options?: IWaitForResourceOptions) {
    return this.user.waitForResource(filter, options);
  }

  public async waitForElement(element: ISuperElement, options?: IWaitForElementOptions) {
    return this.user.waitForElement(element, options);
  }

  public async waitForLocation(trigger: ILocationTrigger) {
    return this.user.waitForLocation(trigger);
  }

  public async waitForMillis(millis: number) {
    return this.user.waitForMillis(millis);
  }

  public async waitForWebSocket(url: string | RegExp) {
    return this.user.waitForWebSocket(url);
  }
}

// CREATE

export async function createBrowser(
  options: ICreateBrowserOptions,
  coreClient: CoreClient,
): Promise<Browser> {
  const sessionName = scriptInstance.generateSessionName(options.name);
  delete options.name;

  const sessionOptions: ICreateSessionOptions = {
    ...options,
    sessionName,
    scriptInstanceMeta: scriptInstance.meta,
  };
  const coreClientSession = await coreClient.createSession(sessionOptions);

  let showReplay = true;
  if (options.showReplay !== undefined) {
    showReplay = options.showReplay;
  } else if (process.env.SA_SHOW_REPLAY === 'false' || process.env.SA_SHOW_REPLAY === '0') {
    showReplay = false;
  }

  if (showReplay) {
    scriptInstance.launchReplay(sessionName, coreClientSession);
  }
  return new Browser(coreClientSession, sessionName);
}
