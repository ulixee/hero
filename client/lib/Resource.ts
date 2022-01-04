import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import IResourceType from '@ulixee/hero-interfaces/IResourceType';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import Timer from '@ulixee/commons/lib/Timer';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import * as Util from 'util';
import CoreTab from './CoreTab';
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
  coreTab: Promise<CoreTab>;
}

const propertyKeys: (keyof Resource)[] = [
  'url',
  'isRedirect',
  'type',
  'request',
  'response',
  'documentUrl',
  'data',
  'json',
  'text',
];

export default class Resource {
  public get request(): ResourceRequest {
    return getState(this).request;
  }

  public get response(): ResourceResponse {
    return getState(this).response;
  }

  public get url(): string {
    return getState(this).resource.url;
  }

  public get documentUrl(): string {
    return getState(this).resource.documentUrl;
  }

  public get type(): IResourceType {
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

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
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
    const resourceOptions: IWaitForResourceOptions = {
      sinceCommandId: options?.sinceCommandId,
      timeoutMs: 2e3,
      throwIfTimeout: false,
    };

    let isComplete = false;
    const done = (): boolean => (isComplete = true);

    do {
      try {
        const waitForResourcePromise = coreTab.waitForResource(resourceFilter, resourceOptions);
        const foundResources = await timer.waitForPromise(
          waitForResourcePromise,
          'Timeout waiting for Resource(s)',
        );
        resourceOptions.sinceCommandId = coreTab.commandQueue.lastCommandId;

        for (const resourceMeta of foundResources) {
          if (idsSeen.has(resourceMeta.id)) continue;
          idsSeen.add(resourceMeta.id);

          const resource = createResource(Promise.resolve(coreTab), resourceMeta);

          let shouldInclude = true;

          if (filter.filterFn) {
            // resources can trigger commandQueue functions, so time them out
            shouldInclude = await timer.waitForPromise(
              Promise.resolve(filter.filterFn(resource, done)),
              'Timeout waiting for waitResource.filterFn',
            );
          }

          if (shouldInclude) resources.push(resource);

          if (isComplete) break;
        }
      } catch (err) {
        if (err instanceof TimeoutError) {
          if (options?.throwIfTimeout === false) {
            return resources;
          }
        }
        throw err;
      }

      // if no filter callback provided, break after 1 found
      if (!filter.filterFn && resources.length) {
        done();
      }
    } while (!isComplete);

    return resources;
  }
}

export function createResource(coreTab: Promise<CoreTab>, resourceMeta: IResourceMeta): Resource {
  if (resourceMeta.type === 'Websocket') {
    return createWebsocketResource(resourceMeta, coreTab);
  }
  const resource = new Resource();
  const request = createResourceRequest(coreTab, resourceMeta.id);
  const response = createResourceResponse(coreTab, resourceMeta.id);
  setState(resource, { coreTab, resource: resourceMeta, request, response });
  return resource;
}
