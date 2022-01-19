import IResourceMeta from './IResourceMeta';
import IWebsocketMessage from './IWebsocketMessage';

export default interface ICollectedResource extends Required<IResourceMeta> {
  response: Required<IResourceMeta['response']> & { text: string; json: any; buffer: Buffer };
  messages?: IWebsocketMessage[];
  text: string;
  json: any;
  buffer: Buffer;
}
