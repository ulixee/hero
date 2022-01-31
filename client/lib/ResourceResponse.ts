import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import IResourceResponse from '@ulixee/hero-interfaces/IResourceResponse';
import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';
import * as Util from 'util';
import CoreTab from './CoreTab';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';

const propertyKeys: (keyof ResourceResponse)[] = [
  'headers',
  'url',
  'timestamp',
  'remoteAddress',
  'statusCode',
  'statusMessage',
  'browserLoadFailure',
  'browserServedFromCache',
  'buffer',
  'text',
  'json',
];

export default class ResourceResponse {
  #coreTab: Promise<CoreTab>;
  #resourceId?: number;
  #response: IResourceResponse;

  constructor(coreTab: Promise<CoreTab>, response: IResourceResponse, resourceId: number) {
    this.#coreTab = coreTab;
    this.#response = response;
    this.#resourceId = resourceId;
  }

  public get browserServedFromCache(): null | IHttpResourceLoadDetails['browserServedFromCache'] {
    return this.#response?.browserServedFromCache;
  }

  public get browserLoadFailure(): string {
    return this.#response?.browserLoadFailure;
  }

  public get headers(): IResourceHeaders {
    return this.#response?.headers;
  }

  public get url(): string {
    return this.#response?.url;
  }

  public get timestamp(): Date {
    const timestamp = this.#response?.timestamp;
    return timestamp ? new Date(timestamp) : null;
  }

  public get remoteAddress(): string {
    return this.#response?.remoteAddress;
  }

  public get statusCode(): number {
    return this.#response?.statusCode;
  }

  public get statusMessage(): string {
    return this.#response?.statusMessage;
  }

  public get buffer(): Promise<Buffer> {
    if (this.#response?.body) return Promise.resolve(this.#response.body);
    const id = this.#resourceId;
    return this.#coreTab.then(x => x.getResourceProperty(id, `response.body`));
  }

  public get text(): Promise<string> {
    return this.buffer.then(x => x?.toString());
  }

  public get json(): Promise<any> {
    return this.text.then(JSON.parse);
  }

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
  }
}

export function createResourceResponse(
  coreTab: Promise<CoreTab>,
  resourceMeta?: IResourceMeta,
): ResourceResponse {
  return new ResourceResponse(coreTab, resourceMeta.response, resourceMeta.id);
}
