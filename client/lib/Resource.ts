import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import CoreClientSession from './CoreClientSession';
import ResourceRequest, { createResourceRequest } from './ResourceRequest';
import ResourceResponse, { createResourceResponse } from './ResourceResponse';
import { createWebsocketResource } from './WebsocketResource';

const { getState, setState } = StateMachine<Resource, IState>();

interface IState {
  resource: IResourceMeta;
  request: ResourceRequest;
  response: ResourceResponse;
  coreClientSession: CoreClientSession;
}

const propertyKeys: (keyof Resource)[] = [
  'url',
  'isRedirect',
  'type',
  'request',
  'response',
  'data',
  'json',
  'text',
];

export default class Resource {
  constructor() {
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
    return getState(this).resource.type;
  }

  public get isRedirect(): boolean {
    return getState(this).resource.isRedirect ?? false;
  }

  public get data(): Promise<Buffer> {
    const id = getState(this).resource.id;
    return getState(this).coreClientSession.getResourceProperty<Buffer>(id, 'data');
  }

  public text(): Promise<string> {
    return this.data.then(x => x.toString());
  }

  public json(): Promise<any> {
    return this.text().then(JSON.parse);
  }
}

export function createResource(resourceMeta: IResourceMeta, coreClientSession: CoreClientSession) {
  if (resourceMeta.type === 'Websocket') {
    return createWebsocketResource(resourceMeta, coreClientSession);
  }
  const resource = new Resource();
  const request = createResourceRequest(coreClientSession, resourceMeta.id);
  const response = createResourceResponse(coreClientSession, resourceMeta.id);
  setState(resource, { coreClientSession, resource: resourceMeta, request, response });
  return resource;
}
