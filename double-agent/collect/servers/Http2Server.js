"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http2 = require("http2");
const Certs_1 = require("./Certs");
const createHttpRequestHandler_1 = require("../lib/createHttpRequestHandler");
const createWebsocketHandler_1 = require("../lib/createWebsocketHandler");
const BaseServer_1 = require("./BaseServer");
class Http2Server extends BaseServer_1.default {
    constructor(port, routesByPath) {
        super('http2', port, routesByPath);
        this.sessions = [];
    }
    async start(context) {
        await super.start(context);
        const httpRequestHandler = (0, createHttpRequestHandler_1.default)(this, context);
        const websocketHandler = (0, createWebsocketHandler_1.default)(this, context);
        const options = {
            ...(0, Certs_1.default)(),
            allowHTTP1: true, // allow http1 for older browsers
        };
        this.http2Server = await new Promise((resolve) => {
            const server = http2.createSecureServer(options, httpRequestHandler);
            server.on('upgrade', websocketHandler);
            server.on('checkContinue', (request, response) => {
                const session = this.sessions.find((x) => x.session === request.stream.session);
                session.activity.push({
                    type: 'checkContinue',
                    data: {
                        remoteWindowSize: session.session?.state?.remoteWindowSize,
                        headers: request.headers,
                    },
                });
                response.writeContinue();
            });
            server.on('session', (session) => {
                const sessionActivity = {
                    session,
                    id: `${session.socket.remoteAddress}:${session.socket.remotePort}`,
                    activity: [],
                };
                const activity = sessionActivity.activity;
                session.on('connect', () => {
                    activity.push({
                        type: 'connect',
                        data: {
                            remoteWindowSize: session.state?.remoteWindowSize,
                        },
                    });
                });
                this.sessions.push(sessionActivity);
                session.on('ping', (bytes) => {
                    activity.push({
                        type: 'ping',
                        data: bytes.toString('utf8'),
                    });
                });
                session.on('close', () => {
                    activity.push({
                        type: 'close',
                        data: {
                            remoteWindowSize: session.state?.remoteWindowSize,
                        },
                    });
                });
                session.on('frameError', (frameType, errorCode, streamID) => {
                    activity.push({
                        type: 'frameError',
                        data: {
                            frameType,
                            errorCode,
                            streamID,
                            remoteWindowSize: session.state?.remoteWindowSize,
                        },
                    });
                });
                session.on('remoteSettings', (remoteSettings) => {
                    const settings = {};
                    for (const [key, value] of Object.entries(http2.getDefaultSettings())) {
                        // aliased property
                        if (key === 'maxHeaderSize')
                            continue;
                        if (remoteSettings[key] !== value) {
                            settings[key] = remoteSettings[key];
                        }
                    }
                    activity.push({
                        type: 'remoteSettings',
                        data: {
                            settings,
                            remoteWindowSize: session.state?.remoteWindowSize,
                        },
                    });
                });
                session.on('localSettings', (settings) => {
                    activity.push({
                        type: 'localSettings',
                        data: {
                            settings,
                            remoteWindowSize: session.state?.remoteWindowSize,
                        },
                    });
                });
                session.on('goaway', (errorCode, lastStreamID, opaqueData) => {
                    activity.push({
                        type: 'goaway',
                        data: {
                            errorCode,
                            lastStreamID,
                            opaqueData,
                            remoteWindowSize: session.state?.remoteWindowSize,
                        },
                    });
                });
                session.on('stream', (stream, headers, flags) => {
                    activity.push({
                        type: 'stream',
                        data: {
                            id: stream.id,
                            authority: headers[':authority'],
                            method: headers[':method'],
                            scheme: headers[':scheme'],
                            path: headers[':path'],
                            flags,
                            weight: stream.state.weight,
                            hpackOutboundSize: session.state.deflateDynamicTableSize,
                            hpackInboundSize: session.state.inflateDynamicTableSize,
                            remoteWindowSize: session.state.remoteWindowSize,
                        },
                    });
                    stream.on('streamClosed', (code) => {
                        activity.push({
                            type: 'streamClosed',
                            data: { code, remoteWindowSize: session.state?.remoteWindowSize },
                        });
                    });
                    stream.on('trailers', (trailers, trailerFlags) => {
                        activity.push({
                            type: 'trailers',
                            data: {
                                trailers,
                                flags: trailerFlags,
                                remoteWindowSize: session.state?.remoteWindowSize,
                            },
                        });
                    });
                });
            });
            server.listen(this.port, () => resolve(server));
        });
        return this;
    }
    async stop() {
        this.sessions.forEach((x) => x.session.close());
        this.http2Server.close();
        console.log(`HTTPS Server closed (port: ${this.port}`);
    }
}
exports.default = Http2Server;
//# sourceMappingURL=Http2Server.js.map