import IHello from './IHello';

export default interface IServerHello extends IHello {
  type: 'ServerHello';
  cipher: string;
  compressionMethod: string;
}
