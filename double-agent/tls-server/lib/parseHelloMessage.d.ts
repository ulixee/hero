import IClientHello from '../interfaces/IClientHello';
import IServerHello from '../interfaces/IServerHello';
export default function parseHelloMessage(isClientHello: boolean, lines: string[]): IClientHello | IServerHello;
declare const greaseCodes: number[];
export { greaseCodes };
