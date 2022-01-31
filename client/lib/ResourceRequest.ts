import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import IResourceRequest from '@ulixee/hero-interfaces/IResourceRequest';
import * as Util from 'util';
import CoreTab from './CoreTab';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';

const propertyKeys: (keyof ResourceRequest)[] = [
  'headers',
  'url',
  'timestamp',
  'method',
  'postData',
];

export default class ResourceRequest {
  #request: IResourceRequest;
  #resourceId?: number;
  #coreTab: Promise<CoreTab>;

  constructor(coreTab: Promise<CoreTab>, request: IResourceRequest, resourceId: number) {
    this.#resourceId = resourceId;
    this.#request = request;
    this.#coreTab = coreTab;
  }

  public get headers(): IResourceHeaders {
    return this.#request?.headers;
  }

  public get url(): string {
    return this.#request?.url;
  }

  public get timestamp(): Date {
    const timestamp = this.#request?.timestamp;
    return timestamp ? new Date(timestamp) : null;
  }

  public get method(): string {
    return this.#request?.method;
  }

  public get postData(): Promise<Buffer> {
    if (this.#request?.postData) return Promise.resolve(this.#request.postData);
    const id = this.#resourceId;
    return this.#coreTab.then(x => x.getResourceProperty(id, `request.postData`));
  }

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
  }
}

export function createResourceRequest(
  coreTab: Promise<CoreTab>,
  resourceMeta: IResourceMeta,
): ResourceRequest {
  return new ResourceRequest(coreTab, resourceMeta.request, resourceMeta.id);
}
