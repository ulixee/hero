import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import IWebsocketMessage from './IWebsocketMessage';

export default interface IDetachedResource {
  name: string;
  timestamp: number;
  commandId: number;
  resource: Required<IResourceMeta>;
  websocketMessages?: IWebsocketMessage[];
}
