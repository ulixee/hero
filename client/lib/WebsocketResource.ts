import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import CoreClientSession from './CoreClientSession';
import ResourceRequest, { createResourceRequest } from './ResourceRequest';
import ResourceResponse, { createResourceResponse } from './ResourceResponse';
import AwaitedEventTarget from './AwaitedEventTarget';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import IWebsocketMessage from '@secret-agent/core-interfaces/IWebsocketMessage';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';

const { getState, setState } = StateMachine<WebsocketResource, IState>();

interface IState {
  resource: IResourceMeta;
  request: ResourceRequest;
  response: ResourceResponse;
  coreClientSession: CoreClientSession;
  awaitedPath: AwaitedPath;
}

const propertyKeys: (keyof WebsocketResource)[] = ['url', 'request', 'response'];

const subscribeErrorMessage = `Websocket responses do not have a body. To retrieve messages, subscribe to events: on('message', ...)`;

export default class WebsocketResource extends AwaitedEventTarget<{ message: IWebsocketMessage }> {
  constructor() {
    super();
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
  coreClientSession: CoreClientSession,
) {
  const resource = new WebsocketResource();
  const request = createResourceRequest(coreClientSession, resourceMeta.id);
  const response = createResourceResponse(coreClientSession, resourceMeta.id);
  const awaitedPath = new AwaitedPath('resources', String(resourceMeta.id));
  setState(resource, { coreClientSession, resource: resourceMeta, request, response, awaitedPath });
  return resource;
}
