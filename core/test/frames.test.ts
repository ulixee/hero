import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import { Helpers } from '@secret-agent/testing';
import { Page } from '@secret-agent/puppet-chrome/lib/Page';
import Core, { Session } from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer(true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should handle opening a page', async () => {
  const connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect());
  const meta = await connection.createSession();
  const tab = Session.getTab(meta);
  await tab.goto(koaServer.baseUrl);
  await tab.waitForLoad(LocationStatus.AllContentLoaded);

  const page = tab.puppetPage as Page;

  expect(page.mainFrame.getActiveContextId(false)).toBeTruthy();
  expect(page.mainFrame.getActiveContextId(true)).toBeTruthy();

  await tab.close();
});

test('should track navigations and redirects', async () => {
  const connection = Core.addConnection();
  Helpers.onClose(() => connection.disconnect());
  const meta = await connection.createSession();
  const tab = Session.getTab(meta);
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
  await tab.goto(`${koaServer.baseUrl}/page1`);

  const pageLink1 = await tab.execJsPath([
    'window',
    'document',
    ['querySelector', 'a'],
    'textContent',
  ]);
  expect(pageLink1.value).toBe('Click Me');
  await tab.interact([
    {
      command: InteractionCommand.click,
      mousePosition: ['window', 'document', ['querySelector', 'a']],
    },
  ]);

  await tab.waitForLoad(LocationStatus.AllContentLoaded);

  const page = tab.puppetPage as Page;
  const frames = page.framesManager;
  expect(page.mainFrame.getActiveContextId(false)).toBeTruthy();
  expect(page.mainFrame.getActiveContextId(true)).toBeTruthy();

  // @ts-ignore
  expect(frames.activeContexts.size).toBe(2);

  // make sure we can use the active context associated with the new window
  const pageLink = await tab.execJsPath([
    'window',
    'document',
    ['querySelector', 'a'],
    'textContent',
  ]);
  expect(pageLink.value).toBe('Find Me');

  await tab.close();
});
