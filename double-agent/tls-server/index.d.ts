import { EventEmitter } from 'events';
import ServerResponse from './lib/ServerResponse';
import IncomingMessage from './lib/IncomingMessage';
export default class TlsServer extends EventEmitter {
    private child;
    private port;
    private openSslOutput;
    private activeRequest;
    private listenCallback;
    private readonly options;
    private readonly secureConnectionListener;
    constructor(options: {
        key: Buffer;
        cert: Buffer;
    }, secureConnectionListener: (req: IncomingMessage, res: ServerResponse) => Promise<void>);
    listen(port: number, callback?: () => void): void;
    close(): void;
    private emitRequest;
    private handleChildMessage;
    private handleOpenSslOutput;
    private emitError;
    static createServer(options: any, secureConnectionListener: any): TlsServer;
}
