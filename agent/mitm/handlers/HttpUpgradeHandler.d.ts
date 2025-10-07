import * as net from 'net';
import BaseHttpHandler from './BaseHttpHandler';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
export default class HttpUpgradeHandler extends BaseHttpHandler {
    readonly clientSocket: net.Socket;
    readonly clientHead: Buffer;
    constructor(request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest'>, clientSocket: net.Socket, clientHead: Buffer);
    onUpgrade(): Promise<void>;
    protected onError(errorType: string, error: Error): void;
    private onResponse;
    static onUpgrade(request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest'> & {
        socket: net.Socket;
        head: Buffer;
    }): Promise<void>;
}
