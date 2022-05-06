import IResourceMeta from '@bureau/interfaces/IResourceMeta';
import IWebsocketMessage from './IWebsocketMessage';

export default interface ICollectedResource {
  name: string;
  timestamp: number;
  commandId: number;
  resource: Required<IResourceMeta>;
  websocketMessages?: IWebsocketMessage[];
}
