"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpLookupServices = void 0;
exports.default = lookupPublicIp;
exports.httpGet = httpGet;
exports.http2Get = http2Get;
const http = require("http");
const https = require("https");
const url = require("url");
const unblocked_agent_mitm_socket_1 = require("@ulixee/unblocked-agent-mitm-socket");
const MitmSocketSession_1 = require("@ulixee/unblocked-agent-mitm-socket/lib/MitmSocketSession");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const http2 = require("http2");
let sharedSession;
let cachedMachineIp;
const { log } = (0, Logger_1.default)(module);
async function lookupPublicIp(ipLookupServiceUrl = exports.IpLookupServices.ipify, agent, proxyUrl) {
    if (cachedMachineIp && !proxyUrl && !agent)
        return cachedMachineIp;
    if (!ipLookupServiceUrl.startsWith('http'))
        ipLookupServiceUrl = `https://${ipLookupServiceUrl}`;
    if (proxyUrl && proxyUrl.startsWith('http')) {
        // require https for lookup services over http proxies
        ipLookupServiceUrl.replace('http://', 'https://');
    }
    const parseLookupServiceUrl = parse(ipLookupServiceUrl);
    const port = parseLookupServiceUrl.port ?? parseLookupServiceUrl.protocol === 'https:' ? 443 : 80;
    const requestOptions = {
        method: 'GET',
    };
    let socketWrapper;
    const socketOptions = {
        host: parseLookupServiceUrl.host,
        port: String(port),
        servername: parseLookupServiceUrl.host,
        keepAlive: false,
        isSsl: ipLookupServiceUrl.startsWith('https'),
        proxyUrl,
    };
    // create a temp agent if not using a MITM
    if (proxyUrl && !agent) {
        if (!sharedSession) {
            sharedSession = new MitmSocketSession_1.default(log, {
                rejectUnauthorized: false,
            });
            ShutdownHandler_1.default.register(() => sharedSession.close());
        }
        socketWrapper = new unblocked_agent_mitm_socket_1.default(`session${ipLookupServiceUrl}`, log, socketOptions);
    }
    if (agent) {
        socketWrapper = await agent.createSocketConnection(socketOptions);
    }
    if (socketWrapper?.isHttp2()) {
        const h2Client = http2.connect(`https://${parseLookupServiceUrl.host}`, {
            createConnection: () => socketWrapper.socket,
        });
        try {
            const ip = await http2Get(parseLookupServiceUrl.path, h2Client);
            if (!proxyUrl && !agent)
                cachedMachineIp = ip;
            return ip;
        }
        finally {
            h2Client.close();
            socketWrapper?.close();
        }
    }
    try {
        if (socketWrapper) {
            requestOptions.createConnection = () => socketWrapper.socket;
            requestOptions.agent = null;
        }
        const ip = await httpGet(ipLookupServiceUrl, requestOptions);
        if (!proxyUrl && !agent)
            cachedMachineIp = ip;
        return ip;
    }
    finally {
        if (socketWrapper)
            socketWrapper.close();
    }
}
function httpGet(requestUrl, requestOptions) {
    const httpModule = requestUrl.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
        const request = httpModule.request(requestUrl, requestOptions, async (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(httpGet(res.headers.location, requestOptions));
                return;
            }
            res.on('error', reject);
            res.setEncoding('utf8');
            let result = '';
            for await (const chunk of res) {
                result += chunk;
            }
            resolve(result);
        });
        request.on('error', reject);
        request.end();
    });
}
async function http2Get(path, h2Client) {
    const res = await h2Client.request({ ':path': path });
    res.setEncoding('utf8');
    let result = '';
    for await (const chunk of res) {
        result += chunk;
    }
    return result;
}
const parsedLookupServicesByUrl = new Map();
function parse(requestUrl) {
    if (!parsedLookupServicesByUrl.has(requestUrl)) {
        const options = url.parse(requestUrl);
        options.port ||= requestUrl.startsWith('https') ? '443' : '80';
        parsedLookupServicesByUrl.set(requestUrl, options);
    }
    return parsedLookupServicesByUrl.get(requestUrl);
}
exports.IpLookupServices = {
    ipify: 'api.ipify.org',
    icanhazip: 'icanhazip.com', // warn: using cloudflare as of 11/19/21
    aws: 'checkip.amazonaws.com',
    identMe: 'ident.me',
    ifconfigMe: 'ifconfig.me/ip',
    ipecho: 'ipecho.net/plain',
    ipinfo: 'ipinfo.io/ip',
    opendns: 'diagnostic.opendns.com/myip',
};
//# sourceMappingURL=lookupPublicIp.js.map