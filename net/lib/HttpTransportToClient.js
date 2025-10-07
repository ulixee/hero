"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
require("@ulixee/commons/lib/SourceMapSupport");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const QueryString = require("querystring");
const url_1 = require("url");
const Kb = 1e3;
class HttpTransportToClient extends eventUtils_1.TypedEventEmitter {
    constructor(request, response) {
        super();
        this.request = request;
        this.response = response;
        this.isConnected = true;
        this.remoteId = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
    }
    send(message) {
        const res = this.response;
        try {
            res.writeHead(200, {
                'Content-Type': 'text/json',
            });
            res.end(TypeSerializer_1.default.stringify(message));
        }
        catch (err) {
            res.writeHead(500);
            res.end(err.toString());
        }
        this.emit('disconnected');
        return Promise.resolve();
    }
    async readRequest(maxPayloadKb = 1e3, dontEmit = false) {
        const req = this.request;
        const url = new url_1.URL(req.url, 'http://localhost/');
        let size = 0;
        const body = [];
        const maxPayloadSize = maxPayloadKb * Kb;
        for await (const chunk of req) {
            size += chunk.length;
            if (size > maxPayloadSize)
                throw new Error('Max size exceeded!');
            body.push(chunk);
        }
        let args;
        if (body.length) {
            const bodyText = Buffer.concat(body).toString();
            if (req.headers['content-type'] === 'text/json' ||
                req.headers['content-type'] === 'application/json') {
                args = TypeSerializer_1.default.parse(bodyText);
            }
            else {
                args = QueryString.parse(bodyText);
            }
        }
        args ??= {};
        const queryParams = Object.fromEntries(url.searchParams.entries());
        Object.assign(args, queryParams);
        let message = args;
        if (!('command' in message)) {
            const command = url.pathname.replace(/\//g, '');
            message = { command, args };
        }
        message.messageId ??= String((HttpTransportToClient.requestCounter += 1));
        if (!dontEmit) {
            this.emit('message', message);
        }
        return message;
    }
}
HttpTransportToClient.requestCounter = 1;
exports.default = HttpTransportToClient;
//# sourceMappingURL=HttpTransportToClient.js.map