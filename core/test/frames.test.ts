import Core from '../index';
import { Helpers } from '../../testing';
import DomEnv from '../lib/DomEnv';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { InteractionCommand } from '../../core-interfaces/IInteractions';
import { LocationStatus } from '../../core-interfaces/Location';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

test('should handle opening a page', async () => {
  const meta = await Core.createSession();
  const core = Core.byWindowId[meta.windowId];
  await core.goto(koaServer.baseUrl);
  await core.waitForLoad(LocationStatus.AllContentLoaded);

  // @ts-ignore
  const window = core.window;

  expect(window.frameTracker.getActiveContext('', window.frameTracker.mainFrameId)).toBeTruthy();
  expect(
    window.frameTracker.getActiveContext(
      DomEnv.installedDomWorldName,
      window.frameTracker.mainFrameId,
    ),
  ).toBeTruthy();

  await core.close();
});

test('should track navigations and redirects', async () => {
  const meta = await Core.createSession();
  const core = Core.byWindowId[meta.windowId];
  // @ts-ignore
  const window = core.window;
  koaServer.get('/page1', ctx => {
    ctx.body = `
        <body>
          <a href="/page2">Click Me</a>
        </body>
      `;
  });
  koaServer.get('/page2', ctx => {
    ctx.redirect('/pagePre3');
  });
  koaServer.get('/pagePre3', ctx => {
    ctx.redirect('/page3');
  });
  koaServer.get('/page3', ctx => {
    ctx.body = `
        <body>
          <a href="/page4">Find Me</a>
        </body>
      `;
  });
  await core.goto(`${koaServer.baseUrl}/page1`);

  const pageLink1 = await core.execJsPath([
    'window',
    'document',
    ['querySelector', 'a'],
    'textContent',
  ]);
  expect(pageLink1.value).toBe('Click Me');
  await core.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', 'a']],
    },
  ]);

  await core.waitForLoad(LocationStatus.AllContentLoaded);

  expect(window.frameTracker.getActiveContext('', window.frameTracker.mainFrameId)).toBeTruthy();
  expect(
    window.frameTracker.getActiveContext(
      DomEnv.installedDomWorldName,
      window.frameTracker.mainFrameId,
    ),
  ).toBeTruthy();

  // @ts-ignore
  expect(window.frameTracker.activeContexts.size).toBe(3);

  // make sure we can use the active context associated with the new window
  const pageLink = await core.execJsPath([
    'window',
    'document',
    ['querySelector', 'a'],
    'textContent',
  ]);
  expect(pageLink.value).toBe('Find Me');

  await core.close();
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
