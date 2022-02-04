import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import IResourceType from '@ulixee/hero-interfaces/IResourceType';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import Timer from '@ulixee/commons/lib/Timer';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import * as Util from 'util';
import CoreTab from './CoreTab';
import ResourceRequest, { createResourceRequest } from './ResourceRequest';
import ResourceResponse, { createResourceResponse } from './ResourceResponse';
import { createWebsocketResource } from './WebsocketResource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import { InternalPropertiesSymbol } from './InternalProperties';
import Tab, { getCoreTab } from './Tab';

const propertyKeys: (keyof Resource)[] = [
  'url',
  'isRedirect',
  'type',
  'request',
  'response',
  'documentUrl',
  'buffer',
  'json',
  'text',
];

export default class Resource {
  readonly #coreTabPromise: Promise<CoreTab>;
  readonly #resourceMeta: IResourceMeta;
  readonly request: ResourceRequest;
  readonly response: ResourceResponse;

  get [InternalPropertiesSymbol](): {
    coreTabPromise: Promise<CoreTab>;
    resourceMeta: IResourceMeta;
  } {
    return {
      coreTabPromise: this.#coreTabPromise,
      resourceMeta: this.#resourceMeta,
    }
  }

  constructor(coreTabPromise: Promise<CoreTab>, resourceMeta: IResourceMeta) {
    this.#coreTabPromise = coreTabPromise;
    this.#resourceMeta = resourceMeta;
    this.request = createResourceRequest(coreTabPromise, resourceMeta);
    this.response = createResourceResponse(coreTabPromise, resourceMeta);
  }

  public get url(): string {
    return this.#resourceMeta.url;
  }

  public get documentUrl(): string {
    return this.#resourceMeta.documentUrl;
  }

  public get type(): IResourceType {
    return this.#resourceMeta.type;
  }

  public get isRedirect(): boolean {
    return this.#resourceMeta.isRedirect ?? false;
  }

  public get buffer(): Promise<Buffer> {
    return this.response.buffer;
  }

  public get text(): Promise<string> {
    return this.buffer.then(x => x.toString());
  }

  public get json(): Promise<any> {
    return this.text.then(JSON.parse);
  }

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
  }

  public static async findLatest(
    tab: Tab,
    filter: IResourceFilterProperties,
    options: { sinceCommandId: number },
  ): Promise<Resource> {
    const coreTab = await getCoreTab(tab);
    const resourceMeta = await coreTab.findResource(filter, options);
    if (resourceMeta) {
      return createResource(Promise.resolve(coreTab), resourceMeta);
    }
    return null;
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
    return createWebsocketResource(resourceMeta, coreTab) as any;
  }
  return new Resource(coreTab, resourceMeta);
}
