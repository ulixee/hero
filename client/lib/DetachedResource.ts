import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import IResourceType from '@unblocked-web/specifications/agent/net/IResourceType';
import IWebsocketMessage from '@ulixee/hero-interfaces/IWebsocketMessage';
import IDetachedResourceDetails from '../interfaces/IDetachedResourceDetails';

export default class DetachedResource implements IDetachedResourceDetails {
  public documentUrl: string;
  public frameId: number;
  public id: number;
  public isRedirect: boolean;
  public receivedAtCommandId: number;
  public seenAtCommandId: number;
  public tabId: number;
  public type: IResourceType;
  public url: string;
  public messages: IWebsocketMessage[];

  public get buffer(): Buffer {
    return this.response.buffer;
  }

  public get json(): any {
    if (this.buffer) return JSON.parse(this.buffer.toString());
    return null;
  }

  public get text(): string {
    return this.buffer?.toString();
  }

  public readonly request: IDetachedResourceDetails['request'];
  public readonly response: IDetachedResourceDetails['response'];

  #detachedResource: IDetachedResource;

  constructor(detachedResource: IDetachedResource) {
    this.#detachedResource = detachedResource;
    const resource = detachedResource.resource;
    this.messages = detachedResource.websocketMessages;
    Object.assign(this, resource);
    this.response = (resource.response as any) ?? {};

    Object.defineProperties(resource.response, {
      json: { get: () => this.json, enumerable: true },
      text: { get: () => this.text, enumerable: true },
    });

    this.request = resource.request;
  }
}
