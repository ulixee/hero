import Core from '@secret-agent/core';
import { Helpers } from '@secret-agent/shared-testing';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import SessionLoader from '../lib/SessionLoader';
import SessionDb from '@secret-agent/shared-session-state/lib/SessionDb';

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

describe('basic Session Replay tests', () => {
  it('detects added nodes', async () => {
    koaServer.get('/test1', ctx => {
      ctx.body = `<body>
          <h1>This is page 1</h1>
          <input type="text" name="anything" value="none">
          <a href="/test2">Click me</a>
        </body>
      `;
    });
    koaServer.get('/test2', ctx => {
      ctx.body = `<body>
          <h1>This is page 2</h1>
        </body>
      `;
    });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test1`);
    await core.waitForLoad('AllContentLoaded');
    await new Promise(resolve => setTimeout(resolve, 100));
    await core.interact([
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'test' }],
        mousePosition: ['window', 'document', ['querySelector', 'input']],
      },
    ]);
    await core.waitForElement(['document', ['querySelector', 'a']]);
    await core.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);
    await core.waitForMillis(100);
    await core.waitForLoad('AllContentLoaded');
    const location = await core.execJsPath(['location', 'href']);
    expect(location.value).toBe(`${koaServer.baseUrl}/test2`);

    await Core.shutdown();

    // @ts-ignore
    const baseDir = core.session.baseDir;
    const sessionDb = new SessionDb(baseDir, meta.sessionId, { readonly: true });
    const sessionLoader = new SessionLoader(sessionDb);
    const ticks = sessionLoader.ticks;
    expect(ticks).toHaveLength(8);

    const urls = sessionLoader.pages;
    expect(urls).toHaveLength(2);
    expect(urls[0].url).toBe(`${koaServer.baseUrl}/test1`);

    const firstCommand = sessionLoader.getCommand(ticks[0].commandId);
    expect(firstCommand.name).toBe('goto');
    expect(ticks[1].label).toBe('waitForLoad');
    expect(ticks[1].minorTicks).toHaveLength(1);
    const paintEvents = sessionLoader.fetchPaintEventsSlice(ticks[1].minorTicks[0].paintEventIdx);
    expect(paintEvents[0].changeEvents).toHaveLength(13);
  });
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
