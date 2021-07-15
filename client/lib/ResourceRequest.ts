import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import IResourceRequest from '@ulixee/hero-interfaces/IResourceRequest';
import * as Util from 'util';
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

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
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
