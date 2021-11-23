import { Helpers } from '@ulixee/hero-testing';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import Log from '@ulixee/commons/lib/Logger';
import RequestSession from '@ulixee/hero-mitm/handlers/RequestSession';
import MitmServer from '@ulixee/hero-mitm/lib/MitmProxy';
import lookupPublicIp, { IpLookupServices } from '../lib/helpers/lookupPublicIp';
import BrowserEmulator from '../index';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';

const { log } = Log(module);
const browserEmulatorId = BrowserEmulator.id;
const selectBrowserMeta = BrowserEmulator.selectBrowserMeta();

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('can resolve a v4 address', async () => {
  await expect(lookupPublicIp()).resolves.toBeTruthy();
});

test('can resolve an ip address with a mitm socket', async () => {
  const mitmServer = await MitmServer.start();
  Helpers.needsClosing.push(mitmServer);

  const plugins = new CorePlugins({ browserEmulatorId, selectBrowserMeta }, log as IBoundLog);
  const session = new RequestSession(`1`, plugins);
  mitmServer.registerSession(session, false);
  Helpers.needsClosing.push(session);

  await expect(lookupPublicIp(IpLookupServices.aws, session.requestAgent)).resolves.toBeTruthy();
});
