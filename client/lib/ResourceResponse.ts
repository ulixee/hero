import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import IResourceResponse from '@ulixee/hero-interfaces/IResourceResponse';
import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';
import * as Util from 'util';
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
  'browserLoadFailure',
  'browserServedFromCache',
  'buffer',
  'text',
  'json',
];

export default class ResourceResponse {
  public get browserServedFromCache(): Promise<
    null | IHttpResourceLoadDetails['browserServedFromCache']
  > {
    return getResponseProperty(this, 'browserServedFromCache');
  }

  public get browserLoadFailure(): Promise<string> {
    return getResponseProperty(this, 'browserLoadFailure');
  }

  public get headers(): Promise<IResourceHeaders> {
    return getResponseProperty(this, 'headers');
  }

  public get url(): Promise<string> {
    return getResponseProperty(this, 'url');
  }

  public get timestamp(): Promise<Date> {
    return getResponseProperty(this, 'timestamp').then(x => (x ? new Date(x as number) : null));
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

  public get buffer(): Promise<Buffer> {
    return getResponseProperty(this, 'buffer');
  }

  public get text(): Promise<string> {
    return this.buffer.then(x => x?.toString());
  }

  public get json(): Promise<any> {
    return this.text.then(JSON.parse);
  }

  public [Util.inspect.custom](): any {
    return inspectInstanceProperties(this, propertyKeys as any);
  }
}

export function createResourceResponse(
  coreTab: Promise<CoreTab>,
  resourceId?: number,
): ResourceResponse {
  const response = new ResourceResponse();
  setState(response, { coreTab, resourceId });
  return response;
}

function getResponseProperty<T>(
  container: ResourceResponse,
  name: keyof IResourceResponse | 'buffer',
): Promise<T> {
  const state = getState(container);
  const id = state.resourceId;
  return state.coreTab.then(x => x.getResourceProperty<T>(id, `response.${name}`));
}
