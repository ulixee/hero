import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import IResourceResponse from '@secret-agent/core-interfaces/IResourceResponse';
import CoreTab from './CoreTab';

const { getState, setState } = StateMachine<ResourceResponse, IState>();

interface IState {
  coreTab: Promise<CoreTab>;
  resourceId: number;
}

const propertyKeys: (keyof ResourceResponse)[] = [
  'headers',
  'url',
  'timestamp',
  'remoteAddress',
  'statusCode',
  'statusMessage',
  'data',
];

export default class ResourceResponse {
  constructor() {
    initializeConstantsAndProperties(this, [], propertyKeys);
  }

  public get headers(): Promise<IResourceHeaders> {
    return getResponseProperty(this, 'headers');
  }

  public get url(): Promise<string> {
    return getResponseProperty(this, 'url');
  }

  public get timestamp(): Promise<string> {
    return getResponseProperty(this, 'timestamp');
  }

  public get remoteAddress(): Promise<string> {
    return getResponseProperty(this, 'remoteAddress');
  }

  public get statusCode(): Promise<number> {
    return getResponseProperty(this, 'statusCode');
  }

  public get statusMessage(): Promise<string> {
    return getResponseProperty(this, 'statusMessage');
  }

  public get data(): Promise<Buffer> {
    return getResponseProperty(this, 'data');
  }

  public text(): Promise<string> {
    return this.data.then(x => x.toString());
  }

  public json(): Promise<any> {
    return this.text().then(JSON.parse);
  }
}

export function createResourceResponse(coreTab: Promise<CoreTab>, resourceId?: number) {
  const response = new ResourceResponse();
  setState(response, { coreTab, resourceId });
  return response;
}

function getResponseProperty<T>(
  container: ResourceResponse,
  name: keyof IResourceResponse | 'data',
) {
  const state = getState(container);
  const id = state.resourceId;
  return state.coreTab.then(x => x.getResourceProperty<T>(id, `response.${name}`));
}
