import IHttpHeaders from '@unblocked-web/specifications/agent/net/IHttpHeaders';
import IResourceResponse from '@unblocked-web/specifications/agent/net/IResourceResponse';
import IHttpResourceLoadDetails from '@unblocked-web/specifications/agent/net/IHttpResourceLoadDetails';
import IResourceMeta from '@unblocked-web/specifications/agent/net/IResourceMeta';
import CoreTab from './CoreTab';

export default class ResourceResponse {
  public readonly url: string;
  public readonly timestamp: Date;
  public readonly headers: IHttpHeaders;
  public readonly trailers?: IHttpHeaders;
  public readonly browserServedFromCache?: IHttpResourceLoadDetails['browserServedFromCache'];
  public readonly browserLoadFailure?: string;
  public readonly browserLoadedTime?: Date;
  public readonly remoteAddress: string;
  public readonly statusCode: number;
  public readonly statusMessage?: string;

  #coreTab: Promise<CoreTab>;
  #resourceId?: number;
  #response: IResourceResponse;

  constructor(coreTab: Promise<CoreTab>, response: IResourceResponse, resourceId: number) {
    this.#coreTab = coreTab;
    this.#response = response;
    this.#resourceId = resourceId;
    if (response) {
      this.url = response.url;
      this.timestamp = response.timestamp ? new Date(response.timestamp) : null;
      this.headers = response.headers;
      this.trailers = response.trailers;
      this.browserServedFromCache = response.browserServedFromCache;
      this.browserLoadedTime = response.browserLoadedTime
        ? new Date(response.browserLoadedTime)
        : null;
      this.browserLoadFailure = response.browserLoadFailure;
      this.statusCode = response.statusCode;
      this.statusMessage = response.statusMessage;
      this.remoteAddress = response.remoteAddress;
    }
  }

  public get buffer(): Promise<Buffer> {
    if (this.#response?.buffer) return Promise.resolve(this.#response.buffer);
    const id = this.#resourceId;
    return this.#coreTab.then(x => x.getResourceProperty(id, `response.buffer`));
  }

  public get text(): Promise<string> {
    return this.buffer.then(x => x?.toString());
  }

  public get json(): Promise<any> {
    return this.text.then(JSON.parse);
  }
}

export function createResourceResponse(
  coreTab: Promise<CoreTab>,
  resourceMeta?: IResourceMeta,
): ResourceResponse {
  return new ResourceResponse(coreTab, resourceMeta.response, resourceMeta.id);
}
