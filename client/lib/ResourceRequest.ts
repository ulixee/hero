import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import IResourceHeaders from '@secret-agent/core-interfaces/IResourceHeaders';
import IResourceRequest from '@secret-agent/core-interfaces/IResourceRequest';
import CoreSession from './CoreTab';

const { getState, setState } = StateMachine<ResourceRequest, IState>();

interface IState {
  coreTab: Promise<CoreSession>;
  resourceId: number;
}

const propertyKeys: (keyof ResourceRequest)[] = [
  'headers',
  'url',
  'timestamp',
  'method',
  'postData',
];

export default class ResourceRequest {
  constructor() {
    initializeConstantsAndProperties(this, [], propertyKeys);
  }

  public get headers(): Promise<IResourceHeaders> {
    return getRequestProperty(this, 'headers');
  }

  public get url(): Promise<string> {
    return getRequestProperty(this, 'url');
  }

  public get timestamp(): Promise<string> {
    return getRequestProperty(this, 'timestamp');
  }

  public get method(): Promise<string> {
    return getRequestProperty(this, 'method');
  }

  public get postData(): Promise<any> {
    return getRequestProperty(this, 'postData');
  }
}

export function createResourceRequest(
  coreTab: Promise<CoreSession>,
  resourceId?: number,
): ResourceRequest {
  const request = new ResourceRequest();
  setState(request, { coreTab, resourceId });
  return request;
}

function getRequestProperty<T>(
  container: ResourceRequest,
  name: keyof IResourceRequest,
): Promise<T> {
  const state = getState(container);
  const id = state.resourceId;
  return state.coreTab.then(x => x.getResourceProperty<T>(id, `request.${name}`));
}
