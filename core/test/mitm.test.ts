import GlobalPool from '@secret-agent/core/lib/GlobalPool';
import { UpstreamProxy } from '@secret-agent/mitm';
import { Helpers } from '@secret-agent/testing';

test('should be able to run multiple pages each with their own proxy', async () => {
  const acquireUpstreamProxyUrl = jest.spyOn<any, any>(UpstreamProxy.prototype, 'acquireProxyUrl');

  await GlobalPool.start();
  try {
    const httpServer = await Helpers.runHttpServer();

    const url1 = `${httpServer.url}page1`;
    const browserSession1 = await GlobalPool.createSession({});
    await browserSession1.window.goto(url1);
    await browserSession1.window.waitForMillis(100);
    expect(acquireUpstreamProxyUrl).toHaveBeenLastCalledWith(url1);

    const url2 = `${httpServer.url}page2`;
    const browserSession2 = await GlobalPool.createSession({});
    await browserSession2.window.goto(url2);
    await browserSession2.window.waitForMillis(100);
    expect(acquireUpstreamProxyUrl).toHaveBeenLastCalledWith(url2);

    await httpServer.close();
  } finally {
    await GlobalPool.close();
  }
}, 10000);

afterEach(async () => await Helpers.closeAll(), 20000);
