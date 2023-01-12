import { Helpers, TestLogger } from '@ulixee/unblocked-plugins-testing';
import RequestSession from '@ulixee/unblocked-agent-mitm/handlers/RequestSession';
import * as Proxy from 'proxy';
import MitmServer from '@ulixee/unblocked-agent-mitm/lib/MitmProxy';
import { ITestKoaServer } from '@ulixee/unblocked-plugins-testing/helpers';
import Pool from '@ulixee/unblocked-agent/lib/Pool';
import * as http from 'http';
import { createPromise } from '@ulixee/commons/lib/utils';
import lookupPublicIp, { IpLookupServices } from '../lib/helpers/lookupPublicIp';
import BrowserEmulator from '../index';

let koaServer: ITestKoaServer;

let pool: Pool;
beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  pool = new Pool({ plugins: [BrowserEmulator] });
  await pool.start();
  Helpers.onClose(() => pool.close(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('can resolve a v4 address', async () => {
  await expect(lookupPublicIp()).resolves.toBeTruthy();
});

test('can resolve an ip address with a mitm socket', async () => {
  const mitmServer = await MitmServer.start(null);
  Helpers.needsClosing.push(mitmServer);

  const session = new RequestSession(`1`, {}, TestLogger.forTest(module));
  mitmServer.registerSession(session, false);
  Helpers.needsClosing.push(session);

  await expect(lookupPublicIp(IpLookupServices.aws, session.requestAgent)).resolves.toBeTruthy();
});

test('should override webrtc ip', async () => {
  const publicIp = await lookupPublicIp();
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
  const browserPlugin = agent.plugins.instances[0] as BrowserEmulator;
  // @ts-expect-error
  const domSpy = jest.spyOn(browserPlugin.domOverridesBuilder, 'add');
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  expect(domSpy).toHaveBeenCalledWith('webrtc', {
    localIp: expect.any(String),
    proxyIp: '1.1.1.1',
  });
  const resultCandidates = await page.evaluate<string[]>(webrtcScript);
  expect(resultCandidates.length).toBeGreaterThanOrEqual(1);
  expect(resultCandidates.find(x => x.includes('1.1.1.1'))).toBeTruthy();
  expect(resultCandidates.find(x => x.includes(publicIp))).toBeFalsy();
});

test('should override webrtc ip when mitm disabled', async () => {
  const publicIp = await lookupPublicIp();
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
  const browserPlugin = agent.plugins.instances[0] as BrowserEmulator;
  // @ts-expect-error
  const domSpy = jest.spyOn(browserPlugin.domOverridesBuilder, 'add');
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  expect(domSpy).toHaveBeenCalledWith('webrtc', {
    localIp: expect.any(String),
    proxyIp: '1.1.1.1',
  });
  const resultCandidates = await page.evaluate<string[]>(webrtcScript);
  expect(resultCandidates.length).toBeGreaterThanOrEqual(1);
  expect(resultCandidates.find(x => x.includes('1.1.1.1'))).toBeTruthy();
  expect(resultCandidates.find(x => x.includes(publicIp))).toBeFalsy();
});

async function startProxy() {
  const proxyPromise = createPromise();
  const proxy = new Proxy(http.createServer());
  proxy.listen(0, () => {
    proxyPromise.resolve();
  });
  proxy.unref();

  Helpers.needsClosing.push(proxy);
  await proxyPromise.promise;
  return proxy;
}

let webrtcScript = `(() => {
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
