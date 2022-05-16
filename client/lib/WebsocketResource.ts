import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import IResourceMeta from '@unblocked-web/specifications/agent/net/IResourceMeta';
import IResourceType from '@unblocked-web/specifications/agent/net/IResourceType';
import * as Util from 'util';
import CoreTab from './CoreTab';
import ResourceRequest, { createResourceRequest } from './ResourceRequest';
import ResourceResponse, { createResourceResponse } from './ResourceResponse';
import AwaitedEventTarget from './AwaitedEventTarget';
import { InternalPropertiesSymbol } from './internal';
import IWebsocketMessage from '@ulixee/hero-interfaces/IWebsocketMessage';

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
  public readonly url: string;
  public readonly documentUrl: string;
  public readonly type = 'Websocket' as IResourceType;
  public readonly isRedirect: boolean;
  public readonly request: ResourceRequest;
  public readonly response: ResourceResponse;

  #awaitedPath: AwaitedPath;
  readonly #coreTabPromise: Promise<CoreTab>;
  readonly #resourceMeta: IResourceMeta;

  get [InternalPropertiesSymbol](): {
    coreTabPromise: Promise<CoreTab>;
    resourceMeta: IResourceMeta;
  } {
    return {
      coreTabPromise: this.#coreTabPromise,
      resourceMeta: this.#resourceMeta,
    };
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
    this.url = resourceMeta.url;
    this.documentUrl = resourceMeta.documentUrl;
    this.isRedirect = resourceMeta.isRedirect ?? false;
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
