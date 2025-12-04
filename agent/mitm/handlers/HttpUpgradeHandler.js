"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("@ulixee/commons/lib/Logger");
const MitmRequestContext_1 = require("../lib/MitmRequestContext");
const BaseHttpHandler_1 = require("./BaseHttpHandler");
const ResourceState_1 = require("../interfaces/ResourceState");
const { log } = (0, Logger_1.default)(module);
class HttpUpgradeHandler extends BaseHttpHandler_1.default {
    constructor(request, clientSocket, clientHead) {
        super(request, true, null);
        this.clientSocket = clientSocket;
        this.clientHead = clientHead;
        this.context.setState(ResourceState_1.default.ClientToProxyRequest);
        this.context.events.on(this.clientSocket, 'error', this.onError.bind(this, 'ClientToProxy.UpgradeSocketError'));
    }
    async onUpgrade() {
        try {
            const proxyToServerRequest = await this.createProxyToServerRequest();
            if (!proxyToServerRequest) {
                this.cleanup();
                return;
            }
            this.context.events.once(proxyToServerRequest, 'upgrade', this.onResponse.bind(this));
            proxyToServerRequest.end();
        }
        catch (err) {
            this.onError('ClientToProxy.UpgradeHandlerError', err);
        }
    }
    onError(errorType, error) {
        const socket = this.clientSocket;
        const context = this.context;
        const url = context.url.href;
        const session = context.requestSession;
        const sessionId = session.sessionId;
        context.setState(ResourceState_1.default.Error);
        session.emit('http-error', { request: MitmRequestContext_1.default.toEmittedResource(context), error });
        if (!error[Logger_1.hasBeenLoggedSymbol]) {
            log.info(`MitmWebSocketUpgrade.${errorType}`, {
                sessionId,
                error,
                url,
            });
        }
        socket.destroy(error);
        this.cleanup();
    }
    async onResponse(serverResponse, serverSocket, serverHead) {
        this.context.setState(ResourceState_1.default.ServerToProxyOnResponse);
        serverSocket.pause();
        MitmRequestContext_1.default.readHttp1Response(this.context, serverResponse);
        this.context.serverToProxyResponse = serverResponse;
        const clientSocket = this.clientSocket;
        const { proxyToServerMitmSocket, requestSession, events } = this.context;
        events.on(clientSocket, 'end', () => proxyToServerMitmSocket.close());
        events.on(serverSocket, 'end', () => proxyToServerMitmSocket.close());
        events.on(proxyToServerMitmSocket, 'close', () => {
            this.context.setState(ResourceState_1.default.End);
            // don't try to write again
            try {
                clientSocket.destroy();
                serverSocket.destroy();
                this.cleanup();
            }
            catch (err) {
                // no-operation
            }
        });
        // copy response message (have to write to raw socket)
        let responseMessage = `HTTP/${serverResponse.httpVersion} ${serverResponse.statusCode} ${serverResponse.statusMessage}\r\n`;
        for (let i = 0; i < serverResponse.rawHeaders.length; i += 2) {
            responseMessage += `${serverResponse.rawHeaders[i]}: ${serverResponse.rawHeaders[i + 1]}\r\n`;
        }
        this.context.responseBodySize = 0;
        await requestSession.willSendHttpResponse(this.context);
        this.context.setState(ResourceState_1.default.WriteProxyToClientResponseBody);
        clientSocket.write(`${responseMessage}\r\n`, error => {
            if (error)
                this.onError('ProxyToClient.UpgradeWriteError', error);
        });
        await requestSession.didSendHttpResponse(this.context);
        if (!serverSocket.readable || !serverSocket.writable) {
            this.context.setState(ResourceState_1.default.PrematurelyClosed);
            try {
                serverSocket.destroy();
                return;
            }
            catch (error) {
                // don't log if error
            }
        }
        events.on(serverSocket, 'error', this.onError.bind(this, 'ServerToProxy.UpgradeSocketError'));
        if (serverResponse.statusCode === 101) {
            clientSocket.setNoDelay(true);
            clientSocket.setTimeout(0);
            serverSocket.setNoDelay(true);
            serverSocket.setTimeout(0);
        }
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
        serverSocket.resume();
        clientSocket.resume();
        if (serverHead.length > 0)
            serverSocket.unshift(serverHead);
        if (this.clientHead.length > 0)
            clientSocket.unshift(this.clientHead);
        const formattedResponse = MitmRequestContext_1.default.toEmittedResource(this.context);
        this.context.requestSession.emit('response', formattedResponse);
        // don't log close since this stays open...
    }
    static async onUpgrade(request) {
        const handler = new HttpUpgradeHandler(request, request.socket, request.head);
        await handler.onUpgrade();
    }
}
exports.default = HttpUpgradeHandler;
//# sourceMappingURL=HttpUpgradeHandler.js.map