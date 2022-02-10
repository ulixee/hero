import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import IWebsocketMessage from '@ulixee/hero-interfaces/IWebsocketMessage';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import IResourceType from '@ulixee/hero-interfaces/IResourceType';
import * as Util from 'util';
import CoreTab from './CoreTab';
import ResourceRequest, { createResourceRequest } from './ResourceRequest';
import ResourceResponse, { createResourceResponse } from './ResourceResponse';
import AwaitedEventTarget from './AwaitedEventTarget';
import { InternalPropertiesSymbol } from './internal';

interface IEventType {
  message: (message: IWebsocketMessage) => void;
}

const propertyKeys: (keyof WebsocketResource)[] = [
  'url',
  'request',
  'response',
  'messages',
  'documentUrl',
  'type',
  'isRedirect',
];

const subscribeErrorMessage = `Websocket responses do not have a body. To retrieve messages, subscribe to events: on('message', ...)`;

export default class WebsocketResource extends AwaitedEventTarget<IEventType> {
  #awaitedPath: AwaitedPath;
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
    super(() => {
      return {
        target: this.#coreTabPromise,
        jsPath: this.#awaitedPath.toJSON(),
      };
    });
    this.request = createResourceRequest(coreTabPromise, resourceMeta);
    this.response = createResourceResponse(coreTabPromise, resourceMeta);
    this.#awaitedPath = new AwaitedPath(null, 'resources', String(resourceMeta.id));
    this.#coreTabPromise = coreTabPromise;
    this.#resourceMeta = resourceMeta;
  }

  public get url(): string {
    return this.#resourceMeta.url;
  }

  public get documentUrl(): string {
    return this.#resourceMeta.documentUrl;
  }

  public get type(): IResourceType {
    return 'Websocket';
  }

  public get isRedirect(): boolean {
    return this.#resourceMeta.isRedirect ?? false;
  }

  public get messages(): Promise<IWebsocketMessage[]> {
    const resource = this.#resourceMeta;
    if ('messages' in resource) {
      return Promise.resolve((resource as any).messages as IWebsocketMessage[]);
    }
    return this.#coreTabPromise.then(x => x.getResourceProperty(resource.id, 'messages'));
  }

  public get buffer(): Promise<Buffer> {
    throw new Error(subscribeErrorMessage);
  }

  public get text(): Promise<string> {
    throw new Error(subscribeErrorMessage);
  }

  public get json(): Promise<any> {
    throw new Error(subscribeErrorMessage);
  }

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
  }
}

export function createWebsocketResource(
  resourceMeta: IResourceMeta,
  coreTab: Promise<CoreTab>,
): WebsocketResource {
  return new WebsocketResource(coreTab, resourceMeta);
}
