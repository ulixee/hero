import { Helpers } from '@ulixee/hero-testing/index';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Core, { Session } from '../index';
import ConnectionToHeroApiClient from '../connections/ConnectionToHeroApiClient';
import ConnectionToHeroApiCore from '../connections/ConnectionToHeroApiCore';
import { ConnectionToCore } from '@ulixee/net';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
  koaServer.get('/api-test', ctx => {
    ctx.body = `<body>
<a href="#" onclick="addMe()">I am a test</a>
<script>
function addMe() {
  const elem = document.createElement('A');
  elem.setAttribute('id', 'link2');
  elem.setAttribute('href', '/test2');
  document.body.append(elem);
  return false;
}
</script>
</body>`;
  });
});
afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

function createConnectionToApiCore(): ConnectionToHeroApiCore {
  const bridge = ConnectionToHeroApiClient.createBridge();
  return new ConnectionToCore(bridge.transportToCore);
}

describe('basic Apis tests', () => {
  let sessionId: string;
  beforeAll(async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession({
      scriptInstanceMeta: {
        startDate: Date.now(),
        workingDirectory: process.cwd(),
        entrypoint: 'testEntrypoint.js',
        id: '1234',
      },
    });
    const tab = Session.getTab(meta);
    sessionId = meta.sessionId;
    await tab.goto(`${koaServer.baseUrl}/api-test`);
    await tab.waitForLoad('DomContentLoaded');
    await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);
    await Helpers.waitForElement(
      ['document', ['querySelector', 'a#link2']],
      tab.mainFrameEnvironment,
    );
    await tab.session.close();
    await Core.shutdown();
  });

  it('can get a session from apis', async () => {
    const connection = createConnectionToApiCore();

    const result = await connection.sendRequest({
      command: 'Session.find',
      args: [{ scriptEntrypoint: 'testEntrypoint.js' }],
    });
    expect(result.session).toBeTruthy();
    expect(result.session.id).toBe(sessionId);
  });

  it('can search for sessions by command', async () => {
    const connection = createConnectionToApiCore();

    const result = await connection.sendRequest({
      command: 'Sessions.search',
      args: [{ commandArg: 'api-test' }],
    });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].id).toBe(sessionId);
  });

  it('can get the tabs for a session', async () => {
    const connection = createConnectionToApiCore();

    const result = await connection.sendRequest({
      command: 'Session.tabs',
      args: [{ sessionId }],
    });
    expect(result.tabs).toHaveLength(1);
  });

  it('can get the ticks for a session', async () => {
    const connection = createConnectionToApiCore();

    const result = await connection.sendRequest({
      command: 'Session.ticks',
      args: [{ sessionId }],
    });
    expect(result.tabDetails).toHaveLength(1);
    expect(result.tabDetails[0].ticks.length).toBeGreaterThanOrEqual(4);
    expect(result.tabDetails[0].ticks.filter(x => x.isMajor)).toHaveLength(4);
    expect(result.tabDetails[0].ticks.filter(x => x.isNewDocumentTick)).toHaveLength(1);
    // only should be returned if asked for
    expect(result.tabDetails[0].mouse).not.toBeTruthy();
  });

  it('can get the ticks for a session and include details', async () => {
    const connection = createConnectionToApiCore();

    const result = await connection.sendRequest({
      command: 'Session.ticks',
      args: [
        {
          sessionId,
          includePaintEvents: true,
          includeInteractionEvents: true,
          includeCommands: true,
        },
      ],
    });
    expect(result.tabDetails).toHaveLength(1);
    expect(result.tabDetails[0].paintEvents.length).toBeGreaterThanOrEqual(1);
    expect(result.tabDetails[0].commands).toHaveLength(4);
    expect(result.tabDetails[0].mouse.length).toBeGreaterThanOrEqual(1);
  });
});
