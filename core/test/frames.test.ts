import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import Core from '../index';
import { Helpers } from '../../testing';
import DomEnv from '../lib/DomEnv';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should handle opening a page', async () => {
  const meta = await Core.createTab();
  const core = Core.byTabId[meta.tabId];
  await core.goto(koaServer.baseUrl);
  await core.waitForLoad(LocationStatus.AllContentLoaded);

  // @ts-ignore
  const tab = core.tab;

  expect(tab.frameTracker.getActiveContext('', tab.frameTracker.mainFrameId)).toBeTruthy();
  expect(
    tab.frameTracker.getActiveContext(
      DomEnv.installedDomWorldName,
      tab.frameTracker.mainFrameId,
    ),
  ).toBeTruthy();

  await core.close();
});

test('should track navigations and redirects', async () => {
  const meta = await Core.createTab();
  const core = Core.byTabId[meta.tabId];
  // @ts-ignore
  const tab = core.tab;
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

  expect(tab.frameTracker.getActiveContext('', tab.frameTracker.mainFrameId)).toBeTruthy();
  expect(
    tab.frameTracker.getActiveContext(
      DomEnv.installedDomWorldName,
      tab.frameTracker.mainFrameId,
    ),
  ).toBeTruthy();

  // @ts-ignore
  expect(tab.frameTracker.activeContexts.size).toBe(3);

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
