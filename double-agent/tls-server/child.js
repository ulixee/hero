"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const https = require("https");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const minMillisBetweenConnects = 5e3;
let connectionCount = 0;
let lastConnectionDate;
let activeConnection;
const connections = [];
let childServer;
let isShuttingDown = false;
process.on('disconnect', () => {
    shutdown('parent disconnect');
    process.exit(0);
});
process.on('message', (message) => {
    if (message.start) {
        const options = message.start;
        if (options.key)
            options.key = Buffer.from(options.key);
        if (options.cert)
            options.cert = Buffer.from(options.cert);
        start(options);
    }
    else if (message.response) {
        const { response } = message;
        if (!activeConnection || activeConnection.id !== response.connectionId) {
            process.send({ error: `ConnectionId could not be found: ${response.connectionId}` });
            return;
        }
        activeConnection.res.end(response.body);
        const millisWait = millisUntilNextConnect();
        setTimeout(reset, millisWait);
    }
});
function millisUntilNextConnect() {
    const currentDate = new Date();
    const elapsedMillis = Number(currentDate) - Number(lastConnectionDate);
    return elapsedMillis >= minMillisBetweenConnects ? 0 : minMillisBetweenConnects - elapsedMillis;
}
function reset() {
    const millisWait = millisUntilNextConnect();
    if (millisWait) {
        setTimeout(reset, millisWait);
    }
    else {
        activeConnection = undefined;
        process.send({ reset: true });
    }
}
function start(options) {
    try {
        const port = options.port;
        delete options.port;
        Object.assign(options, {
            enableTrace: true,
            sessionTimeout: 10,
        });
        childServer = https.createServer(options, onConnection);
        childServer.on('error', err => {
            process.send({ error: err.message });
            console.log(err);
        });
        childServer.listen(port, () => {
            process.send({ started: true });
        });
        ShutdownHandler_1.default.register(() => shutdown('shutdown handler'));
    }
    catch (err) {
        console.log(err);
    }
}
function shutdown(reason) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    if (reason)
        console.log(`TLS child shutdown: ${reason}`);
    if (childServer)
        childServer.unref().close();
    while (connections.length) {
        const connection = connections.pop();
        console.log('Force closing active connection during shutdown.');
        connection.res.end('Server shutting down');
        connection.req.destroy();
    }
}
async function onConnection(req, res) {
    lastConnectionDate = new Date();
    res.connection.setKeepAlive(false);
    if (activeConnection && req.url === '/favicon.ico') {
        process.send({ favicon: true });
        res.end(`Favicon`);
        return;
    }
    if (activeConnection) {
        res.end(`Overloaded. Try again in ${minMillisBetweenConnects / 1000} seconds`);
        process.send({ overloaded: true });
        return;
    }
    const connectionId = (connectionCount += 1); // eslint-disable-line no-multi-assign
    activeConnection = { id: connectionId, req, res };
    connections.push(activeConnection);
    try {
        const { remoteAddress, remotePort } = req.connection;
        const secureSocket = req.connection;
        const request = {
            connectionId,
            connection: {
                remoteAddress,
                remotePort,
            },
            socket: {
                remoteAddress,
                remotePort,
            },
            url: req.url,
            method: req.method,
            headers: req.headers,
            rawHeaders: req.rawHeaders,
            alpnProtocol: secureSocket.alpnProtocol,
            cipherName: secureSocket.getCipher()?.name,
            tlsProtocol: secureSocket.getProtocol(),
        };
        process.send({ request });
    }
    catch (err) {
        process.send({ error: 'Error servicing request' });
        console.log('Error servicing request', err);
    }
}
//# sourceMappingURL=child.js.map