import IResourceMeta from './IResourceMeta';
import IWebsocketMessage from './IWebsocketMessage';

export default interface ICollectedResource {
  name: string;
  timestamp: number;
  commandId: number;
  resource: Required<IResourceMeta>;
  websocketMessages?: IWebsocketMessage[];
}
