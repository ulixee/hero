import { Helpers, TestLogger } from '@unblocked-web/agent-testing';
import RequestSession from '@unblocked-web/agent-mitm/handlers/RequestSession';
import MitmServer from '@unblocked-web/agent-mitm/lib/MitmProxy';
import lookupPublicIp, { IpLookupServices } from '../lib/helpers/lookupPublicIp';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('can resolve a v4 address', async () => {
  await expect(lookupPublicIp()).resolves.toBeTruthy();
});

test('can resolve an ip address with a mitm socket', async () => {
  const mitmServer = await MitmServer.start();
  Helpers.needsClosing.push(mitmServer);

  const session = new RequestSession(`1`, {}, TestLogger.forTest(module));
  mitmServer.registerSession(session, false);
  Helpers.needsClosing.push(session);

  await expect(lookupPublicIp(IpLookupServices.aws, session.requestAgent)).resolves.toBeTruthy();
});
