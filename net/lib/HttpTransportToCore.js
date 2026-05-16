"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const http = require("http");
const https = require("https");
const RemoteError_1 = require("../errors/RemoteError");
class HttpTransportToCore extends eventUtils_1.TypedEventEmitter {
    constructor(host) {
        super();
        this.isConnected = false;
        this.isDisconnecting = false;
        this.pendingRequestsToPromise = new Map();
        this.httpAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 5e3,
        });
        this.httpsAgent = new https.Agent({
            keepAlive: true,
            keepAliveMsecs: 5e3,
        });
        this.host = host;
        this.disconnect = this.disconnect.bind(this);
    }
    async send(payload) {
        await this.connect();
        const message = Buffer.from(TypeSerializer_1.default.stringify(payload));
        const url = new URL(`${payload.command}`, `${this.host}/`);
        const result = await this.request(url, message, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
        });
        const responseId = payload.messageId;
        let responsePayload = {
            data: null,
            responseId,
        };
        try {
            if (!result.headers['content-type']?.includes('json')) {
                throw new RemoteError_1.default({ code: result.statusCode, message: result.body });
            }
            responsePayload = TypeSerializer_1.default.parse(result.body);
            if (result.statusCode !== 200 && !(responsePayload instanceof Error)) {
                responsePayload.data = new RemoteError_1.default(responsePayload.data);
            }
        }
        catch (error) {
            responsePayload.data = error;
        }
        responsePayload.responseId ??= responseId;
        this.emit('message', responsePayload);
    }
    async disconnect() {
        if (this.isDisconnecting)
            return;
        this.isDisconnecting = true;
        await Promise.allSettled(this.pendingRequestsToPromise.values());
        this.emit('disconnected');
        this.isConnected = false;
        return Promise.resolve();
    }
    connect() {
        if (!this.isConnected) {
            this.isConnected = true;
            this.emit('connected');
        }
        return Promise.resolve();
    }
    request(url, payload, options) {
        if (this.isDisconnecting) {
            throw new IPendingWaitEvent_1.CanceledPromiseError('Canceling request due to disconnected state');
        }
        const httpModule = url.protocol === 'https:' ? https : http;
        options.agent ??= url.protocol === 'https:' ? this.httpsAgent : this.httpAgent;
        const resolvable = new Resolvable_1.default();
        const request = httpModule.request(url, options, async (res) => {
            this.pendingRequestsToPromise.delete(request);
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = new URL(res.headers.location, url);
                return resolvable.resolve(this.request(redirectUrl, payload, options));
            }
            res.once('error', resolvable.reject);
            const body = [];
            for await (const chunk of res) {
                body.push(chunk);
            }
            resolvable.resolve({
                body: Buffer.concat(body).toString(),
                statusCode: res.statusCode,
                headers: res.headers,
            });
        });
        this.pendingRequestsToPromise.set(request, resolvable.promise);
        request.setSocketKeepAlive(true);
        request.once('error', resolvable.reject);
        request.end(payload);
        return resolvable.promise;
    }
}
exports.default = HttpTransportToCore;
//# sourceMappingURL=HttpTransportToCore.js.map