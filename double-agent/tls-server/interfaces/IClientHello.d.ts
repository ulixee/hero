import IHello from './IHello';
export default interface IClientHello extends IHello {
    type: 'ClientHello';
    ciphers: string[];
    compressionMethods: string[];
}
