import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import IWebsocketMessage from '@secret-agent/interfaces/IWebsocketMessage';
import IResourceMeta from '@secret-agent/interfaces/IResourceMeta';
import ResourceType from '@secret-agent/interfaces/ResourceType';
import CoreTab from './CoreTab';
import ResourceRequest, { createResourceRequest } from './ResourceRequest';
import ResourceResponse, { createResourceResponse } from './ResourceResponse';
import AwaitedEventTarget from './AwaitedEventTarget';

const { getState, setState } = StateMachine<WebsocketResource, IState>();

interface IState {
  resource: IResourceMeta;
  request: ResourceRequest;
  response: ResourceResponse;
  coreTab: Promise<CoreTab>;
  awaitedPath: AwaitedPath;
}

interface IEventType {
  message: IWebsocketMessage;
}

const propertyKeys: (keyof WebsocketResource)[] = ['url', 'request', 'response'];

const subscribeErrorMessage = `Websocket responses do not have a body. To retrieve messages, subscribe to events: on('message', ...)`;

export default class WebsocketResource extends AwaitedEventTarget<IEventType> {
  constructor() {
    super(() => {
      const state = getState(this);
      return {
        target: state.coreTab,
        jsPath: state.awaitedPath.toJSON(),
      };
    });
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
    return 'Websocket';
  }

  public get isRedirect(): boolean {
    return getState(this).resource.isRedirect ?? false;
  }

  public get data(): Promise<Buffer> {
    throw new Error(subscribeErrorMessage);
  }

  public text(): Promise<string> {
    throw new Error(subscribeErrorMessage);
  }

  public json(): Promise<any> {
    throw new Error(subscribeErrorMessage);
  }
}

export function createWebsocketResource(
  resourceMeta: IResourceMeta,
  coreTab: Promise<CoreTab>,
): WebsocketResource {
  const resource = new WebsocketResource();
  const request = createResourceRequest(coreTab, resourceMeta.id);
  const response = createResourceResponse(coreTab, resourceMeta.id);
  const awaitedPath = new AwaitedPath(null, 'resources', String(resourceMeta.id));
  setState(resource, { coreTab, resource: resourceMeta, request, response, awaitedPath });
  return resource;
}
