"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const RequestSession_1 = require("@ulixee/unblocked-agent-mitm/handlers/RequestSession");
const proxy_1 = require("proxy");
const MitmProxy_1 = require("@ulixee/unblocked-agent-mitm/lib/MitmProxy");
const Pool_1 = require("@ulixee/unblocked-agent/lib/Pool");
const http = require("http");
const utils_1 = require("@ulixee/commons/lib/utils");
const lookupPublicIp_1 = require("../lib/helpers/lookupPublicIp");
const index_1 = require("../index");
let koaServer;
let pool;
beforeEach(unblocked_agent_testing_1.Helpers.beforeEach);
beforeAll(async () => {
    pool = new Pool_1.default({ plugins: [index_1.default] });
    await pool.start();
    unblocked_agent_testing_1.Helpers.onClose(() => pool.close(), true);
    koaServer = await unblocked_agent_testing_1.Helpers.runKoaServer();
});
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
test('can resolve a v4 address', async () => {
    await expect(ipLookupWithRetries()).resolves.toBeTruthy();
});
test('can resolve an ip address with a mitm socket', async () => {
    const mitmServer = await MitmProxy_1.default.start(null);
    unblocked_agent_testing_1.Helpers.needsClosing.push(mitmServer);
    const session = new RequestSession_1.default(`1`, {}, unblocked_agent_testing_1.TestLogger.forTest(module));
    mitmServer.registerSession(session, false);
    unblocked_agent_testing_1.Helpers.needsClosing.push(session);
    await expect(ipLookupWithRetries(session.requestAgent)).resolves.toBeTruthy();
});
test('should override webrtc ip', async () => {
    const publicIp = await ipLookupWithRetries();
    const proxy = await startProxy();
    const proxyPort = proxy.address().port;
    const agent = await pool.createAgent({
        options: {
            upstreamProxyUrl: `http://localhost:${proxyPort}`,
            upstreamProxyIpMask: {
                publicIp,
                proxyIp: '1.1.1.1',
            },
        },
    });
    const browserPlugin = agent.plugins.instances[0];
    // @ts-expect-error
    const domSpy = jest.spyOn(browserPlugin.domOverridesBuilder, 'add');
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    expect(domSpy).toHaveBeenCalledWith('webrtc', {
        localIp: expect.any(String),
        proxyIp: '1.1.1.1',
    });
    const resultCandidates = await page.evaluate(webrtcScript);
    if (resultCandidates.length) {
        expect(resultCandidates.filter(x => x.includes('1.1.1.1')).length).toBeGreaterThanOrEqual(0);
        expect(resultCandidates.find(x => x.includes(publicIp))).toBeFalsy();
    }
});
test('should override webrtc ip when mitm disabled', async () => {
    const publicIp = await ipLookupWithRetries();
    const proxy = await startProxy();
    const proxyPort = proxy.address().port;
    const agent = await pool.createAgent({
        options: {
            disableMitm: true,
            upstreamProxyUrl: `http://localhost:${proxyPort}`,
            upstreamProxyIpMask: {
                publicIp,
                proxyIp: '1.1.1.1',
            },
        },
    });
    const browserPlugin = agent.plugins.instances[0];
    // @ts-expect-error
    const domSpy = jest.spyOn(browserPlugin.domOverridesBuilder, 'add');
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    expect(domSpy).toHaveBeenCalledWith('webrtc', {
        localIp: expect.any(String),
        proxyIp: '1.1.1.1',
    });
    const resultCandidates = await page.evaluate(webrtcScript);
    expect(resultCandidates.length).toBeGreaterThanOrEqual(1);
    expect(resultCandidates.find(x => x.includes(publicIp))).toBeFalsy();
});
async function ipLookupWithRetries(agent) {
    for (const service of Object.values(lookupPublicIp_1.IpLookupServices)) {
        try {
            return await (0, lookupPublicIp_1.default)(service, agent);
        }
        catch { }
    }
    throw new Error('Ip lookup failed');
}
async function startProxy() {
    const proxyPromise = (0, utils_1.createPromise)();
    const server = http.createServer();
    const proxy = (0, proxy_1.createProxy)(server);
    proxy.listen(0, () => {
        proxyPromise.resolve();
    });
    proxy.unref();
    unblocked_agent_testing_1.Helpers.needsClosing.push({
        close() {
            server.close();
        },
    });
    await proxyPromise.promise;
    return proxy;
}
const webrtcScript = `(() => {
const peerConnection = new RTCPeerConnection({
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302',
  }],
});
const candidates = [];
peerConnection.onicecandidate = function (evt) {
  if (evt.candidate) {
    console.log(evt.candidate);
    candidates.push(evt.candidate.candidate);
  }

  if (peerConnection.iceGatheringState === 'complete') {
    peerConnection.close();
  }
};

if ('createDataChannel' in peerConnection) peerConnection.createDataChannel('testoff');
return peerConnection
  .createOffer()
  .then(offer => peerConnection.setLocalDescription(offer))
  .then(() => new Promise(resolve => setTimeout(resolve, 500)))
  .then(() => candidates);
})()`;
//# sourceMappingURL=publicIp.test.js.map