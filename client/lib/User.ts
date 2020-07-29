import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import Interactor from './Interactor';
import { ILocationTrigger, LocationStatus } from '@secret-agent/core-interfaces/Location';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import IInteractions, { IMousePosition, ITypeInteraction } from '../interfaces/IInteractions';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import CoreClientSession from './CoreClientSession';
import IWaitForElementOptions from '@secret-agent/core-interfaces/IWaitForElementOptions';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import Resource, { createResource } from './Resource';
import IWaitForResourceFilter from '@secret-agent/core-interfaces/IWaitForResourceFilter';
import Timer from '@secret-agent/commons/Timer';
import TimeoutError from '@secret-agent/commons/interfaces/TimeoutError';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import WebsocketResource from './WebsocketResource';
import Browser from './Browser';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IDomStorage from '@secret-agent/core-interfaces/IDomStorage';

const { getState, setState } = StateMachine<User, IState>();

interface IState {
  browser: Browser;
  coreClientSession: CoreClientSession;
  interactor: Interactor;
}

const propertyKeys: (keyof User)[] = ['cookies', 'storage'];

export default class User {
  constructor(browser: Browser, coreClientSession: CoreClientSession) {
    initializeConstantsAndProperties(this, [], propertyKeys);
    setState(this, {
      browser: browser,
      coreClientSession: coreClientSession,
      interactor: new Interactor(this, coreClientSession),
    });
  }

  public get cookies(): Promise<ICookie[]> {
    return getState(this).coreClientSession.getAllCookies();
  }

  public get storage(): Promise<IDomStorage> {
    const session = getState(this).coreClientSession;
    return session.exportUserProfile().then(x => x.storage);
  }

  public get lastCommandId(): number {
    return getState(this).browser.lastCommandId;
  }

  // METHODS

  public async goto(href: string) {
    const resource = await getState(this).coreClientSession.goto(href);
    return createResource(resource, getState(this).coreClientSession);
  }

  public async click(mousePosition: IMousePosition) {
    await getState(this).interactor.run([{ click: mousePosition }]);
  }

  public async interact(...interactions: IInteractions) {
    await getState(this).interactor.run(interactions);
  }

  public async type(...typeInteractions: ITypeInteraction[]) {
    await getState(this).interactor.run(typeInteractions.map(t => ({ type: t })));
  }

  public async waitForAllContentLoaded(): Promise<void> {
    await getState(this).coreClientSession.waitForLoad(LocationStatus.AllContentLoaded);
  }

  public async waitForLoad(status: LocationStatus): Promise<void> {
    await getState(this).coreClientSession.waitForLoad(status);
  }

  public async waitForResource(
    filter: IWaitForResourceFilter,
    options?: IWaitForResourceOptions,
  ): Promise<(Resource | WebsocketResource)[]> {
    const resources: Resource[] = [];
    const session = getState(this).coreClientSession;
    const browser = getState(this).browser;

    const idsSeen = new Set<number>();

    const timer = new Timer(options?.timeoutMs ?? 30e3);

    const resourceFilter = { url: filter.url, type: filter.type };
    const resourceOptions = {
      ...(options ?? {}),
      timeoutMs: 2e3,
      throwIfTimeout: false,
    } as IWaitForResourceOptions;

    let isComplete = false;
    const done = () => (isComplete = true);

    do {
      let foundResources: IResourceMeta[] = [];

      try {
        foundResources = await timer.waitForPromise(
          session.waitForResource(resourceFilter, resourceOptions),
          'Timeout waiting for Resource(s)',
        );
        resourceOptions.sinceCommandId = browser.lastCommandId;
      } catch (err) {
        if (err instanceof TimeoutError) {
          if (options?.throwIfTimeout === false) {
            return resources;
          }
        }
        throw err;
      }

      for (const resourceMeta of foundResources) {
        if (idsSeen.has(resourceMeta.id)) continue;
        idsSeen.add(resourceMeta.id);

        const resource = createResource(resourceMeta, session);

        if (filter.filterFn) {
          if (filter.filterFn(resource, done)) {
            resources.push(resource);
          }
        } else {
          resources.push(resource);
        }

        if (isComplete) break;
      }

      // if no filter callback provided, break after 1 found
      if (!filter.filterFn && resources.length) {
        done();
      }
    } while (!isComplete);

    return resources;
  }

  public async waitForElement(
    element: ISuperElement,
    options?: IWaitForElementOptions,
  ): Promise<void> {
    const { awaitedPath } = getState<ISuperElement, { awaitedPath: AwaitedPath }>(element);
    await getState(this).coreClientSession.waitForElement(awaitedPath.toJSON(), options);
  }

  public async waitForLocation(trigger: ILocationTrigger): Promise<void> {
    await getState(this).coreClientSession.waitForLocation(trigger);
  }

  public async waitForMillis(millis: number): Promise<void> {
    await getState(this).coreClientSession.waitForMillis(millis);
  }

  public async waitForWebSocket(url: string | RegExp): Promise<void> {
    await getState(this).coreClientSession.waitForWebSocket(url);
  }

  public async exportProfile(): Promise<IUserProfile> {
    return await getState(this).coreClientSession.exportUserProfile();
  }
}

// CREATE

export function createUser(browser: Browser, coreClientSession: CoreClientSession): User {
  return new User(browser, coreClientSession);
}
