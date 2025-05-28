import { IncomingHttpHeaders } from 'http';
import IClientHello from '../interfaces/IClientHello';
export default class IncomingMessage {
    readonly clientHello?: IClientHello;
    readonly connectionId: string;
    readonly connection: {
        remoteAddress?: string;
        remotePort?: number;
    };
    readonly socket: {
        remoteAddress?: string;
        remotePort?: number;
    };
    readonly url?: string;
    readonly method?: string;
    readonly headers: IncomingHttpHeaders;
    readonly rawHeaders: string[];
    readonly alpnProtocol?: string;
    readonly cipherName: string;
    readonly tlsProtocol: string | null;
    constructor(data: IncomingMessage);
    [Symbol.asyncIterator](): AsyncIterator<string>;
}
