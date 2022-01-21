import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import IResourceRequest from '@ulixee/hero-interfaces/IResourceRequest';
import * as Util from 'util';
import CoreTab from './CoreTab';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';

const { getState, setState } = StateMachine<ResourceRequest, IState>();

interface IState {
  coreTab: Promise<CoreTab>;
  resourceId?: number;
  request: IResourceRequest;
}

const propertyKeys: (keyof ResourceRequest)[] = [
  'headers',
  'url',
  'timestamp',
  'method',
  'postData',
];

export default class ResourceRequest {
  public get headers(): IResourceHeaders {
    return getState(this).request?.headers;
  }

  public get url(): string {
    return getState(this).request?.url;
  }

  public get timestamp(): Date {
    const timestamp = getState(this).request?.timestamp;
    return timestamp ? new Date(timestamp) : null;
  }

  public get method(): string {
    return getState(this).request?.method;
  }

  public get postData(): Promise<Buffer> {
    const state = getState(this);
    if (state.request?.postData) return Promise.resolve(state.request.postData);
    const id = state.resourceId;
    return state.coreTab.then(x => x.getResourceProperty(id, `request.postData`));
  }

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
  }
}

export function createResourceRequest(
  coreTab: Promise<CoreTab>,
  resourceMeta: IResourceMeta,
): ResourceRequest {
  const request = new ResourceRequest();
  setState(request, { coreTab, resourceId: resourceMeta.id, request: resourceMeta.request });
  return request;
}
