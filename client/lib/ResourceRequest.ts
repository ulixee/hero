import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import IResourceHeaders from '@secret-agent/interfaces/IResourceHeaders';
import IResourceRequest from '@secret-agent/interfaces/IResourceRequest';
import CoreTab from './CoreTab';

const { getState, setState } = StateMachine<ResourceRequest, IState>();

interface IState {
  coreTab: Promise<CoreTab>;
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

  public get timestamp(): Promise<Date> {
    return getRequestProperty(this, 'timestamp').then(x => (x ? new Date(x as number) : null));
  }

  public get method(): Promise<string> {
    return getRequestProperty(this, 'method');
  }

  public get postData(): Promise<any> {
    return getRequestProperty(this, 'postData');
  }
}

export function createResourceRequest(
  coreTab: Promise<CoreTab>,
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
