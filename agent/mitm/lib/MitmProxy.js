"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const http = require("http");
const https = require("https");
const http2 = require("http2");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const utils_1 = require("@ulixee/commons/lib/utils");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const CertificateGenerator_1 = require("@ulixee/unblocked-agent-mitm-socket/lib/CertificateGenerator");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const HttpRequestHandler_1 = require("../handlers/HttpRequestHandler");
const RequestSession_1 = require("../handlers/RequestSession");
const HttpUpgradeHandler_1 = require("../handlers/HttpUpgradeHandler");
const env_1 = require("../env");
const { log } = (0, Logger_1.default)(module);
const emptyResponse = `<html lang="en"><body></body></html>`;
/**
 * This module is heavily inspired by 'https://github.com/joeferner/node-http-mitm-proxy'
 */
class MitmProxy {
    get port() {
        return this.httpPort;
    }
    get httpPort() {
        return this.httpServer.address()?.port;
    }
    get http2Port() {
        return this.http2Server.address()?.port;
    }
    get httpsPort() {
        return this.httpsServer.address()?.port;
    }
    constructor(options) {
        this.http2Sessions = new Set();
        // shared session params
        this.sessionById = {};
        this.sessionIdByPort = {};
        this.portsBySessionId = {};
        this.serverConnects = new Set();
        this.events = new EventSubscriber_1.default();
        this.isClosing = false;
        this.secureContexts = {};
        this.options = options;
        this.certificateGenerator = options.certificateGenerator;
        this.httpServer = http.createServer({ insecureHTTPParser: true });
        this.events.on(this.httpServer, 'connect', this.onHttpConnect.bind(this));
        this.events.on(this.httpServer, 'clientError', this.onClientError.bind(this, false));
        this.events.on(this.httpServer, 'request', this.onHttpRequest.bind(this, false));
        this.events.on(this.httpServer, 'upgrade', this.onHttpUpgrade.bind(this, false));
        this.httpsServer = https.createServer({ insecureHTTPParser: true });
        this.events.on(this.httpsServer, 'connect', this.onHttpConnect.bind(this));
        this.events.on(this.httpsServer, 'request', this.onHttpRequest.bind(this, true));
        this.events.on(this.httpsServer, 'upgrade', this.onHttpUpgrade.bind(this, true));
        this.http2Server = http2.createSecureServer({ allowHTTP1: true });
        this.events.on(this.http2Server, 'session', this.onHttp2Session.bind(this));
        this.events.on(this.http2Server, 'sessionError', this.onClientError.bind(this, true));
        this.events.on(this.http2Server, 'request', this.onHttpRequest.bind(this, true));
        this.events.on(this.http2Server, 'upgrade', this.onHttpUpgrade.bind(this, true));
    }
    close() {
        if (this.isClosing)
            return;
        this.isClosing = true;
        const startLogId = log.info('MitmProxy.Closing', {
            sessionId: this.isolatedProxyForSessionId,
        });
        const errors = [];
        for (const session of Object.values(this.sessionById)) {
            try {
                session.close();
            }
            catch (err) {
                errors.push(err);
            }
        }
        this.sessionById = {};
        for (const connect of this.serverConnects) {
            destroyConnection(connect);
        }
        this.secureContexts = {};
        try {
            this.httpServer.unref().close();
        }
        catch (err) {
            errors.push(err);
        }
        for (const session of this.http2Sessions) {
            try {
                session.socket?.unref()?.destroy();
                session.destroy();
            }
            catch (err) {
                errors.push(err);
            }
        }
        try {
            this.http2Sessions.clear();
            this.http2Server.unref().close();
        }
        catch (err) {
            errors.push(err);
        }
        try {
            this.httpsServer.unref().close();
        }
        catch (err) {
            errors.push(err);
        }
        this.events.close('error');
        log.stats('MitmProxy.Closed', {
            sessionId: this.isolatedProxyForSessionId,
            parentLogId: startLogId,
            closeErrors: errors,
        });
    }
    /////// RequestSessions //////////////////////////////////////////////////////////////////////////////////////////////
    registerSession(session, isDefault) {
        const { sessionId } = session;
        this.sessionById[sessionId] = session;
        if (isDefault) {
            this.isolatedProxyForSessionId = sessionId;
            this.events.once(session, 'close', () => this.close());
        }
        else {
            // if not default, need to clear out entries
            this.events.once(session, 'close', () => setTimeout(() => this.removeSessionTracking(sessionId), 1e3).unref());
        }
    }
    removeSessionTracking(sessionId) {
        const ports = this.portsBySessionId[sessionId] || [];
        for (const port of ports) {
            delete this.sessionIdByPort[port];
        }
        delete this.portsBySessionId[sessionId];
        delete this.sessionById[sessionId];
    }
    async listen() {
        await startServer(this.httpServer, this.options.port ?? 0);
        await startServer(this.httpsServer);
        await startServer(this.http2Server);
        // don't listen for errors until server already started
        this.events.on(this.httpServer, 'error', this.onGenericHttpError.bind(this, false));
        this.events.on(this.httpsServer, 'error', this.onGenericHttpError.bind(this, false));
        this.events.on(this.http2Server, 'error', this.onGenericHttpError.bind(this, true));
        return this;
    }
    async onHttpRequest(isSSL, clientToProxyRequest, proxyToClientResponse) {
        const sessionId = this.readSessionId(clientToProxyRequest.headers, clientToProxyRequest.socket.remotePort);
        if (!sessionId) {
            return RequestSession_1.default.sendNeedsAuth(proxyToClientResponse.socket);
        }
        const requestSession = this.sessionById[sessionId];
        if (requestSession?.isClosing)
            return;
        if (!requestSession) {
            log.warn('MitmProxy.RequestWithoutSession', {
                sessionId,
                isSSL,
                host: clientToProxyRequest.headers.host ?? clientToProxyRequest.headers[':authority'],
                url: clientToProxyRequest.url,
            });
            proxyToClientResponse.writeHead(504);
            proxyToClientResponse.end();
            return;
        }
        if (requestSession.bypassAllWithEmptyResponse) {
            proxyToClientResponse.end(emptyResponse);
            return;
        }
        try {
            await HttpRequestHandler_1.default.onRequest({
                isSSL,
                requestSession,
                clientToProxyRequest,
                proxyToClientResponse,
            });
        }
        catch (error) {
            // this can only happen during processing of request
            log.warn('MitmProxy.ErrorProcessingRequest', {
                sessionId,
                isSSL,
                error,
                host: clientToProxyRequest.headers.host ?? clientToProxyRequest.headers[':authority'],
                url: clientToProxyRequest.url,
            });
            try {
                proxyToClientResponse.writeHead(400);
                proxyToClientResponse.end('Bad request');
            }
            catch (e) {
                // don't double throw or log
            }
        }
    }
    async onHttpUpgrade(isSSL, clientToProxyRequest, socket, head) {
        // socket resumes in HttpUpgradeHandler.upgradeResponseHandler
        socket.pause();
        const sessionId = this.readSessionId(clientToProxyRequest.headers, clientToProxyRequest.socket.remotePort);
        if (!sessionId) {
            return RequestSession_1.default.sendNeedsAuth(socket);
        }
        const requestSession = this.sessionById[sessionId];
        if (requestSession?.isClosing)
            return;
        if (!requestSession) {
            log.warn('MitmProxy.UpgradeRequestWithoutSession', {
                sessionId,
                isSSL,
                host: clientToProxyRequest.headers.host,
                url: clientToProxyRequest.url,
            });
            socket.end('HTTP/1.1 504 Proxy Error\r\n\r\n');
            return;
        }
        try {
            await HttpUpgradeHandler_1.default.onUpgrade({
                isSSL,
                socket,
                head,
                requestSession,
                clientToProxyRequest,
            });
        }
        catch (error) {
            this.onClientError(false, error, socket);
        }
    }
    async onHttpConnect(request, socket, head) {
        if (this.isClosing)
            return this.tryCloseConnectSocket(socket);
        const sessionId = this.readSessionId(request.headers, request.socket.remotePort);
        if (!sessionId) {
            return RequestSession_1.default.sendNeedsAuth(socket);
        }
        this.serverConnects.add(socket);
        socket.on('error', error => {
            this.onConnectError(request.url, 'ClientToProxy.ConnectError', error);
            this.serverConnects.delete(socket);
        });
        socket.write('HTTP/1.1 200 Connection established\r\n\r\n');
        // we need first byte of data to detect if request is SSL encrypted
        if (!head || head.length === 0) {
            head = await new Promise(resolve => socket.once('data', resolve));
        }
        socket.pause();
        let proxyToProxyPort = this.httpPort;
        // for https we create a new connect back to the https server so we can have the proper cert and see the traffic
        if (MitmProxy.isTlsByte(head)) {
            proxyToProxyPort = this.httpsPort;
            // URL is in the form 'hostname:port'
            const [hostname, port] = request.url.split(':', 2);
            try {
                const [isHttp2] = await Promise.all([
                    this.isHttp2(sessionId, hostname, port),
                    this.addSecureContext(hostname),
                ]);
                if (isHttp2) {
                    proxyToProxyPort = this.http2Port;
                }
            }
            catch (error) {
                if (!(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                    this.onConnectError(request.url, 'ClientToProxy.GenerateCertError', error);
                }
                return this.tryCloseConnectSocket(socket);
            }
        }
        if (!proxyToProxyPort && this.isClosing)
            return;
        try {
            const connectedPromise = (0, utils_1.createPromise)();
            const proxyConnection = net.connect({ port: proxyToProxyPort, allowHalfOpen: false }, connectedPromise.resolve);
            this.serverConnects.add(proxyConnection);
            proxyConnection.on('error', error => {
                this.onConnectError(request.url, 'ProxyToProxy.ConnectError', error);
                if (!socket.destroyed && socket.writable && socket.readable) {
                    socket.destroy(error);
                }
            });
            proxyConnection.once('end', () => this.serverConnects.delete(proxyConnection));
            socket.once('end', () => this.serverConnects.delete(socket));
            proxyConnection.once('close', () => destroyConnection(socket));
            socket.once('close', () => destroyConnection(proxyConnection));
            await connectedPromise;
            this.registerProxySession(proxyConnection, sessionId);
            socket.setNoDelay(true);
            proxyConnection.setNoDelay(true);
            // create a tunnel back to the same proxy
            socket.pipe(proxyConnection).pipe(socket);
            if (head.length)
                socket.emit('data', head);
            socket.resume();
        }
        catch (error) {
            if (this.isClosing)
                return;
            if (!(error instanceof IPendingWaitEvent_1.CanceledPromiseError)) {
                this.onConnectError(request.url, 'ClientToProxy.HttpConnectError', error);
            }
            this.tryCloseConnectSocket(socket);
        }
    }
    onHttp2Session(session) {
        this.http2Sessions.add(session);
        this.events.once(session, 'close', () => this.http2Sessions.delete(session));
    }
    async isHttp2(sessionId, hostname, port) {
        try {
            const requestSession = this.sessionById[sessionId];
            if (requestSession.bypassAllWithEmptyResponse ||
                requestSession.shouldInterceptRequest(`https://${hostname}:${port}`) ||
                requestSession.shouldInterceptRequest(`https://${hostname}`)) {
                return false;
            }
            return await requestSession.requestAgent.isHostAlpnH2(hostname, port);
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError) {
                return false;
            }
            log.warn('Connect.AlpnLookupError', {
                hostname,
                error,
                sessionId,
            });
        }
        return false;
    }
    /////// ERROR HANDLING ///////////////////////////////////////////////////////
    onGenericHttpError(isHttp2, error) {
        const logLevel = this.isClosing ? 'stats' : 'error';
        log[logLevel](`Mitm.Http${isHttp2 ? '2' : ''}ServerError`, {
            sessionId: this.isolatedProxyForSessionId,
            error,
        });
    }
    tryCloseConnectSocket(socket) {
        try {
            // socket.end();
            this.serverConnects.delete(socket);
        }
        catch (err) { }
    }
    onClientError(isHttp2, error, socket) {
        if (error.code === 'ECONNRESET' || !socket.writable) {
            return;
        }
        const kind = isHttp2 ? 'Http2.SessionError' : 'Http.ClientError';
        log.error(`Mitm.${kind}`, {
            sessionId: this.isolatedProxyForSessionId,
            error,
            socketAddress: socket.address(),
        });
        try {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
        catch (e) {
            // just drown these
        }
    }
    onConnectError(hostname, errorKind, error) {
        const errorCodes = [error.errno, error.code];
        if (errorCodes.includes('ECONNRESET')) {
            log.info(`Got ECONNRESET on Proxy Connect, ignoring.`, {
                sessionId: this.isolatedProxyForSessionId,
                hostname,
            });
        }
        else if (errorCodes.includes('ECONNABORTED')) {
            log.info(`Got ECONNABORTED on Proxy Connect, ignoring.`, {
                sessionId: this.isolatedProxyForSessionId,
                hostname,
            });
        }
        else if (errorCodes.includes('ERR_STREAM_UNSHIFT_AFTER_END_EVENT')) {
            log.info(`Got ERR_STREAM_UNSHIFT_AFTER_END_EVENT on Proxy Connect, ignoring.`, {
                sessionId: this.isolatedProxyForSessionId,
                hostname,
                errorKind,
            });
        }
        else if (errorCodes.includes('EPIPE')) {
            log.info(`Got EPIPE on Proxy Connect, ignoring.`, {
                sessionId: this.isolatedProxyForSessionId,
                hostname,
                errorKind,
            });
        }
        else {
            const logLevel = this.isClosing ? 'stats' : 'error';
            log[logLevel]('MitmConnectError', {
                sessionId: this.isolatedProxyForSessionId,
                errorKind,
                error,
                errorCodes,
                hostname,
            });
        }
    }
    async addSecureContext(hostname) {
        if (this.isClosing)
            return;
        if (hostname.includes(':'))
            hostname = hostname.split(':').shift();
        this.secureContexts[hostname] ??= this.certificateGenerator
            .getCertificate(hostname)
            .then(cert => {
            // eslint-disable-next-line promise/always-return
            if (!cert.cert)
                return null;
            this.http2Server.addContext(hostname, cert);
            this.httpsServer.addContext(hostname, cert);
        });
        try {
            await this.secureContexts[hostname];
        }
        catch (error) {
            if (error instanceof IPendingWaitEvent_1.CanceledPromiseError || this.isClosing)
                return;
            throw error;
        }
    }
    /////// SESSION ID MGMT //////////////////////////////////////////////////////////////////////////////////////////////
    readSessionId(requestHeaders, remotePort) {
        if (this.isolatedProxyForSessionId)
            return this.isolatedProxyForSessionId;
        const authHeader = requestHeaders['proxy-authorization'];
        if (!authHeader) {
            return this.sessionIdByPort[remotePort];
        }
        const [, sessionId] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
        return sessionId;
    }
    registerProxySession(loopbackProxySocket, sessionId) {
        // local port is the side that originates from our http server
        this.portsBySessionId[sessionId] ??= new Set();
        this.portsBySessionId[sessionId].add(loopbackProxySocket.localPort);
        this.sessionIdByPort[loopbackProxySocket.localPort] = sessionId;
    }
    static createCertificateGenerator(store, sslCaDir) {
        sslCaDir ??= env_1.default.defaultStorageDirectory;
        return new CertificateGenerator_1.default({ storageDir: sslCaDir });
    }
    static async start(certificateGenerator) {
        const proxy = new MitmProxy({ certificateGenerator });
        await proxy.listen();
        return proxy;
    }
    static isTlsByte(buffer) {
        // check for clienthello byte
        return buffer[0] === 0x16;
    }
}
exports.default = MitmProxy;
function destroyConnection(socket) {
    try {
        socket.unref().destroy();
    }
    catch (e) {
        // nothing to do
    }
}
function startServer(server, listenPort) {
    return new Promise((resolve, reject) => {
        try {
            server.once('error', reject);
            server.listen(listenPort, resolve);
        }
        catch (err) {
            reject(err);
        }
    });
}
//# sourceMappingURL=MitmProxy.js.map