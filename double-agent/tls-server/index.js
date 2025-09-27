"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const child_process_1 = require("child_process");
const config_1 = require("@double-agent/config");
const parseTlsRecordFromStderr_1 = require("./lib/parseTlsRecordFromStderr");
const ServerResponse_1 = require("./lib/ServerResponse");
const IncomingMessage_1 = require("./lib/IncomingMessage");
class TlsServer extends events_1.EventEmitter {
    constructor(options, secureConnectionListener) {
        super();
        this.activeRequest = {};
        this.options = options;
        this.secureConnectionListener = secureConnectionListener;
    }
    listen(port, callback) {
        this.port = port;
        this.listenCallback = callback;
        this.child = (0, child_process_1.fork)(`${__dirname}/child`, [], { stdio: ['ignore', 'inherit', 'pipe', 'ipc'] });
        this.child.stderr.setEncoding('utf8');
        this.child.on('error', err => {
            console.log('ERROR from tls child process', err);
            this.emit('error', err);
        });
        this.child.on('message', this.handleChildMessage.bind(this));
        this.child.stderr.on('data', this.handleOpenSslOutput.bind(this));
        this.child.send({
            start: { ...this.options, port },
        });
    }
    close() {
        this.child.kill('SIGKILL');
    }
    emitRequest() {
        if (!this.activeRequest)
            return;
        if (!this.activeRequest.https)
            return;
        if (!this.activeRequest.clientHello)
            return;
        if (this.activeRequest.isProcessing)
            return;
        this.activeRequest.isProcessing = true;
        const req = new IncomingMessage_1.default({
            ...this.activeRequest.https,
            clientHello: this.activeRequest.clientHello,
        });
        const res = new ServerResponse_1.default(this.child, req);
        void this.secureConnectionListener(req, res);
    }
    handleChildMessage(message) {
        if (message.started) {
            if (this.listenCallback)
                this.listenCallback();
            return;
        }
        if (message.error) {
            this.emitError(message.error);
            return;
        }
        if (message.reset) {
            this.activeRequest = {};
            this.openSslOutput = '';
            return;
        }
        if (message.overloaded) {
            this.emit('overloaded');
            return;
        }
        if (message.favicon) {
            return;
        }
        if (message.request) {
            if (this.activeRequest.https) {
                return this.emitError('Found a conflicting https request');
            }
            this.activeRequest.https = message.request;
            this.emitRequest();
        }
    }
    handleOpenSslOutput(message) {
        if (this.activeRequest.isProcessing)
            return;
        if (config_1.default.collect.tlsPrintRaw) {
            console.log('\n------RAW------\n%s\n\n', message);
        }
        this.openSslOutput += message;
        const messages = this.openSslOutput.split('\n\n');
        this.openSslOutput = messages.pop();
        if (this.activeRequest.clientHello)
            return;
        for (const str of messages) {
            try {
                const record = (0, parseTlsRecordFromStderr_1.default)(str);
                if (record.header.content?.type === 'ClientHello') {
                    this.activeRequest.clientHello = record.header.content;
                    this.emitRequest();
                }
            }
            catch (err) {
                this.emitError(err.message);
            }
        }
    }
    emitError(message) {
        this.emit('error', message);
        console.log(`ERROR: ${message}`);
    }
    static createServer(options, secureConnectionListener) {
        return new TlsServer(options, secureConnectionListener);
    }
}
exports.default = TlsServer;
//# sourceMappingURL=index.js.map