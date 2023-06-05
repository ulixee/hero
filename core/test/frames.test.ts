import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { Helpers } from '@ulixee/hero-testing';
import Core, { Session } from '../index';

let koaServer: ITestKoaServer;
let core: Core;
beforeAll(async () => {
  core = await Core.start();
  koaServer = await Helpers.runKoaServer(true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('can wait for sub-frames to load', async () => {
  const connection = core.addConnection();
  Helpers.onClose(() => connection.disconnect());
  const meta = await connection.createSession();
  const tab = Session.getTab(meta);
  Helpers.needsClosing.push(tab.session);
  koaServer.get('/main', ctx => {
    ctx.body = `
        <body>
        <h1>Iframe Page</h1>
<iframe name="sub" src="/delay"></iframe>
        </body>
      `;
  });

  koaServer.get('/delay', async ctx => {
    await new Promise(resolve => setTimeout(resolve, 500));
    ctx.body = `
        <body>
        <h1>SubPage</h1>
        </body>
      `;
  });
  await tab.goto(`${koaServer.baseUrl}/main`);
  await Helpers.waitForElement(['document', ['querySelector', 'iframe']], tab.mainFrameEnvironment);

  const frames = await tab.getFrameEnvironments();
  expect(frames).toHaveLength(2);
  const frameMeta = frames.find(x => x.parentFrameId !== null);
  const subFrame = tab.frameEnvironmentsById.get(frameMeta.id);

  await expect(subFrame.waitForLoad('PaintingStable')).resolves.toBeTruthy();
});

test('should allow query selectors in cross-domain frames', async () => {
  const connection = core.addConnection();
  Helpers.onClose(() => connection.disconnect());
  const meta = await connection.createSession();

  const session = Session.get(meta.sessionId);
  Helpers.needsClosing.push(session);
  const tab = Session.getTab(meta);
  koaServer.get('/iframePage', ctx => {
    ctx.body = `
        <body>
        <h1>Iframe Page</h1>
<iframe src="https://framesy.org/page"></iframe>
        </body>
      `;
  });

  session.mitmRequestSession.interceptorHandlers.push({
    urls: ['https://framesy.org'],
    handlerFn(url, type, request, response) {
      response.end(`<html lang="en"><body>
<h1>Framesy Page</h1>
<div>This is content inside the frame</div>
</body></html>`);
      return true;
    },
  });

  await tab.goto(`${koaServer.baseUrl}/iframePage`);
  await tab.waitForLoad('DomContentLoaded');

  const outerH1 = await tab.execJsPath([
    'window',
    'document',
    ['querySelector', 'h1'],
    'textContent',
  ]);
  expect(outerH1.value).toBe('Iframe Page');

  // should not allow cross-domain access
  await expect(
    tab.execJsPath([
      'window',
      'document',
      ['querySelector', 'iframe'],
      'contentDocument',
      ['querySelector', 'h1'],
      'textContent',
    ]),
  ).rejects.toThrow();

  const frameMetas = await tab.getFrameEnvironments();
  const frames = await Promise.all(
    frameMetas.map(async x => {
      const env = tab.frameEnvironmentsById.get(x.id);
      await env.waitForLoad('DomContentLoaded');
      return env.toJSON();
    }),
  );
  const innerFrameMeta = frames.find(x => x.url === 'https://framesy.org/page');
  const innerFrame = tab.frameEnvironmentsById.get(innerFrameMeta.id);

  const innerH1 = await innerFrame.execJsPath([
    'window',
    'document',
    ['querySelector', 'h1'],
    'textContent',
  ]);
  expect(innerH1.value).toBe('Framesy Page');
});
