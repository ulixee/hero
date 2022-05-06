import IHttpHeaders from '@bureau/interfaces/IHttpHeaders';
import IResourceRequest from '@bureau/interfaces/IResourceRequest';
import * as Util from 'util';
import CoreTab from './CoreTab';
import IResourceMeta from '@bureau/interfaces/IResourceMeta';
import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';

const propertyKeys: (keyof ResourceRequest)[] = [
  'headers',
  'url',
  'timestamp',
  'method',
  'postData',
];

export default class ResourceRequest {
  public readonly url: string;
  public readonly timestamp: Date;
  public readonly headers: IHttpHeaders;
  public readonly trailers?: IHttpHeaders;
  public readonly method: string;

  #request: IResourceRequest;
  #resourceId?: number;
  #coreTab: Promise<CoreTab>;

  constructor(coreTab: Promise<CoreTab>, request: IResourceRequest, resourceId: number) {
    this.#resourceId = resourceId;
    this.#request = request;
    this.#coreTab = coreTab;
    if (request) {
      this.headers = request.headers;
      this.url = request.url;
      this.timestamp = request.timestamp ? new Date(request.timestamp) : null;
      this.method = request.method;
    }
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
