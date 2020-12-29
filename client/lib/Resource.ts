import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import Timer from '@secret-agent/commons/Timer';
import IWaitForResourceOptions from '@secret-agent/core-interfaces/IWaitForResourceOptions';
import TimeoutError from '@secret-agent/commons/interfaces/TimeoutError';
import CoreSession from './CoreTab';
import ResourceRequest, { createResourceRequest } from './ResourceRequest';
import ResourceResponse, { createResourceResponse } from './ResourceResponse';
import { createWebsocketResource } from './WebsocketResource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import Tab, { getCoreTab } from './Tab';

const { getState, setState } = StateMachine<Resource, IState>();

interface IState {
  resource: IResourceMeta;
  request: ResourceRequest;
  response: ResourceResponse;
  coreTab: Promise<CoreSession>;
}

const propertyKeys: (keyof Resource)[] = [
  'url',
  'isRedirect',
  'type',
  'request',
  'response',
  'data',
  'json',
  'text',
];

export default class Resource {
  constructor() {
    initializeConstantsAndProperties(this, [], propertyKeys);
  }

  public get request(): ResourceRequest {
    return getState(this).request;
  }

  public get response(): ResourceResponse {
    return getState(this).response;
  }

  public get url(): string {
    return getState(this).resource.url;
  }

  public get type(): ResourceType {
    return getState(this).resource.type;
  }

  public get isRedirect(): boolean {
    return getState(this).resource.isRedirect ?? false;
  }

  public get data(): Promise<Buffer> {
    const id = getState(this).resource.id;
    const coreTab = getState(this).coreTab;
    return coreTab.then(x => x.getResourceProperty<Buffer>(id, 'data'));
  }

  public text(): Promise<string> {
    return this.data.then(x => x.toString());
  }

  public json(): Promise<any> {
    return this.text().then(JSON.parse);
  }

  public static async waitFor(
    tab: Tab,
    filter: IWaitForResourceFilter,
    options: IWaitForResourceOptions,
  ): Promise<Resource[]> {
    const coreTab = await getCoreTab(tab);
    const resources: Resource[] = [];

    const idsSeen = new Set<number>();

    const timer = new Timer(options?.timeoutMs ?? 30e3);

    const resourceFilter = { url: filter.url, type: filter.type };
    const resourceOptions = {
      ...(options ?? {}),
      timeoutMs: 2e3,
      throwIfTimeout: false,
    } as IWaitForResourceOptions;

    let isComplete = false;
    const done = (): boolean => (isComplete = true);

    do {
      let foundResources: IResourceMeta[] = [];

      try {
        const waitForResourcePromise = coreTab.waitForResource(resourceFilter, resourceOptions);
        foundResources = await timer.waitForPromise(
          waitForResourcePromise,
          'Timeout waiting for Resource(s)',
        );
        resourceOptions.sinceCommandId = coreTab.commandQueue.lastCommandId;
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

        const resource = createResource(resourceMeta, Promise.resolve(coreTab));

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
}

export function createResource(
  resourceMeta: IResourceMeta,
  coreTab: Promise<CoreSession>,
): Resource {
  if (resourceMeta.type === 'Websocket') {
    return createWebsocketResource(resourceMeta, coreTab);
  }
  const resource = new Resource();
  const request = createResourceRequest(coreTab, resourceMeta.id);
  const response = createResourceResponse(coreTab, resourceMeta.id);
  setState(resource, { coreTab, resource: resourceMeta, request, response });
  return resource;
}
