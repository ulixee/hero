import IServerHello from './IServerHello';
import IClientHello from './IClientHello';

export default interface IHeader {
  from: 'client' | 'server';
  version: string;
  contentType: string;
  length: string;
  content: IClientHello | IServerHello | string;
}
