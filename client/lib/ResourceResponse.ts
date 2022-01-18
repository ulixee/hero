import inspectInstanceProperties from 'awaited-dom/base/inspectInstanceProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import IResourceHeaders from '@ulixee/hero-interfaces/IResourceHeaders';
import IResourceResponse from '@ulixee/hero-interfaces/IResourceResponse';
import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';
import * as Util from 'util';
import CoreTab from './CoreTab';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';

const { getState, setState } = StateMachine<ResourceResponse, IState>();

interface IState {
  coreTab: Promise<CoreTab>;
  resourceId?: number;
  response: IResourceResponse;
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
  public get browserServedFromCache(): null | IHttpResourceLoadDetails['browserServedFromCache'] {
    return getState(this).response?.browserServedFromCache;
  }

  public get browserLoadFailure(): string {
    return getState(this).response?.browserLoadFailure;
  }

  public get headers(): IResourceHeaders {
    return getState(this).response?.headers;
  }

  public get url(): string {
    return getState(this).response?.url;
  }

  public get timestamp(): Date {
    const timestamp = getState(this).response?.timestamp;
    return timestamp ? new Date(timestamp) : null;
  }

  public get remoteAddress(): string {
    return getState(this).response?.remoteAddress;
  }

  public get statusCode(): number {
    return getState(this).response?.statusCode;
  }

  public get statusMessage(): string {
    return getState(this).response?.statusMessage;
  }

  public get buffer(): Promise<Buffer> {
    const state = getState(this);
    if (state.response?.body) return Promise.resolve(state.response.body);
    const id = state.resourceId;
    return state.coreTab.then(x => x.getResourceProperty(id, `response.body`));
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
  resourceMeta?: IResourceMeta,
): ResourceResponse {
  const response = new ResourceResponse();
  setState(response, { coreTab, response: resourceMeta.response, resourceId: resourceMeta.id });
  return response;
}
