import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import HumanEmulator from '@ulixee/hero-plugin-utils/lib/HumanEmulator';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import Core, { GlobalPool, Tab } from '../index';
import ConnectionToClient from '../connections/ConnectionToClient';
import Session from '../lib/Session';
import Interactor from '../lib/Interactor';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import IDomStateResult from '@ulixee/hero-interfaces/IDomStateResult';

const playInteractionSpy = jest.spyOn(Interactor.prototype, 'play');
let koaServer: ITestKoaServer;
let connectionToClient: ConnectionToClient;
beforeAll(async () => {
  Core.use(
    class BasicHumanEmulator extends HumanEmulator {
      static id = 'basic';
    },
  );
  await Core.start();
  connectionToClient = Core.addConnection();
  await connectionToClient.connect();
  Helpers.onClose(() => connectionToClient.disconnect(), true);
  koaServer = await Helpers.runKoaServer();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('sessionResume tests when resume location is currentLocation', () => {
  test('should re-use commands multiple times', async () => {
    koaServer.get('/sessionResume', ctx => (ctx.body = `<body><h1>Hover me</h1></body>`));
    let sessionId: string;

    const sessionEmittedFn = jest.spyOn(Session.prototype, 'emit');
    const sessionCreatedFn = jest.fn();
    const sessionResumedFn = jest.fn();
    const sessionClosedFn = jest.fn();
    const sessionKeptAliveFn = jest.fn();
    GlobalPool.events.on('session-created', sessionCreatedFn);
    for (let i = 0; i < 5; i += 1) {
      const options: ISessionCreateOptions = { sessionKeepAlive: true };
      if (sessionId) {
        options.sessionResume = {
          sessionId,
          startLocation: 'currentLocation',
        };
      }
      const { session, tab } = await createSession(options);
      if (i === 0) {
        session.on('kept-alive', sessionKeptAliveFn);
        session.on('resumed', sessionResumedFn);
        session.on('closed', sessionClosedFn);
      }

      if (sessionId) expect(sessionId).toBe(session.id);

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionResume`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
      ]);

      sessionId = session.id;
      const keepAlives = i;
      expect(session.commands.history).toHaveLength(2 * (i + 1) + keepAlives);
      // should reuse the commands from the first 2
      expect(session.commands.history.filter(x => x.reusedCommandFromRun === 0)).toHaveLength(
        session.commands.history.length - 2 - keepAlives,
      );
      expect(playInteractionSpy).toHaveBeenCalledTimes(1);
      await session.close();
      if (i === 4) {
        await session.close(true);
      }
    }

    expect(sessionCreatedFn).toHaveBeenCalledTimes(1);
    expect(sessionClosedFn).toHaveBeenCalledTimes(1);
    expect(sessionKeptAliveFn).toHaveBeenCalledTimes(5);
    expect(sessionResumedFn).toHaveBeenCalledTimes(4);

    // check all emitted events
    expect(sessionEmittedFn.mock.calls.filter(x => x[0] === 'kept-alive')).toHaveLength(5);
    expect(sessionEmittedFn.mock.calls.filter(x => x[0] === 'resumed')).toHaveLength(4);
    expect(sessionEmittedFn.mock.calls.filter(x => x[0] === 'tab-created')).toHaveLength(1);
  });

  test('should run new commands when there are none matching', async () => {
    playInteractionSpy.mockClear();
    koaServer.get(
      '/sessionAddon',
      ctx => (ctx.body = `<body><h1>Hover me</h1><h5>Another</h5></body>`),
    );
    let sessionId: string;

    {
      const { session, tab } = await createSession({ sessionKeepAlive: true });

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionAddon`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
      ]);
      sessionId = session.id;
      expect(playInteractionSpy).toHaveBeenCalledTimes(1);
    }
    {
      const { session, tab } = await createSession({
        sessionKeepAlive: true,
        sessionResume: {
          sessionId,
          startLocation: 'currentLocation',
        },
      });

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionAddon`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
      ]);

      simulateScriptSendingCommandMeta(session, 3);
      await tab.interact([
        { command: 'click', mousePosition: ['document', ['querySelector', 'h5']] },
      ]);
      expect(playInteractionSpy).toHaveBeenCalledTimes(2);

      expect(session.commands.history).toHaveLength(5);

      expect(session.commands.history.filter(x => x.reusedCommandFromRun === 0)).toHaveLength(2);
    }
  });

  test('should throw an error if commands have diverged from previous run', async () => {
    playInteractionSpy.mockClear();
    koaServer.get(
      '/sessionResumeDivergence',
      ctx =>
        (ctx.body = `<body>
<div id="div1">div 1</div>
<div id="div2">div 2</div>
<div id="div3">div 3</div>
</body>`),
    );
    let sessionId: string;

    {
      const { session, tab } = await createSession({ sessionKeepAlive: true });
      sessionId = session.id;

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionResumeDivergence`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', '#div1']] },
      ]);

      simulateScriptSendingCommandMeta(session, 3);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', '#div2']] },
      ]);

      simulateScriptSendingCommandMeta(session, 4);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', '#div3']] },
      ]);

      simulateScriptSendingCommandMeta(session, 5);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', '#div1']] },
      ]);
      expect(playInteractionSpy).toHaveBeenCalledTimes(4);
    }
    {
      const { session, tab } = await createSession({
        sessionKeepAlive: true,
        sessionResume: {
          sessionId,
          startLocation: 'currentLocation',
        },
      });

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionResumeDivergence`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', '#div1']] },
      ]);

      simulateScriptSendingCommandMeta(session, 3);
      // DIFFERENT DIV! should diverge
      await expect(
        tab.interact([
          { command: 'move', mousePosition: ['document', ['querySelector', '#div3']] }, // changed order
        ]),
      ).rejects.toThrowError('Your script has changed');

      // should not have run any interactions in this step
      expect(playInteractionSpy).toHaveBeenCalledTimes(4);

      // blows up on 8
      expect(session.commands.history).toHaveLength(7);

      // should reuse the commands from only the first one
      expect(session.commands.history.filter(x => x.reusedCommandFromRun === 0)).toHaveLength(2);
    }
  });

  test('should replay awaited events', async () => {
    playInteractionSpy.mockClear();
    koaServer.get(
      '/resumeAwaitedEvents',
      ctx =>
        (ctx.body = `<body>
<div id="div1">div 1</div>
</body>`),
    );
    let sessionId: string;

    {
      const { session, tab } = await createSession({ sessionKeepAlive: true });
      sessionId = session.id;

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/resumeAwaitedEvents`);

      simulateScriptSendingCommandMeta(session, 2);
      const hasDiv = new Resolvable<void>();
      const result = await tab.addRemoteEventListener(
        'dom-state',
        (listenerId: string, status: IDomStateResult) => {
          if (result.listenerId === listenerId) {
            if (status.divText?.value === 'div 1' && status.paintStable === true) hasDiv.resolve();
          }
        },
        ['dom-state', 1],
        {
          callsite: 'callsite',
          states: ['states'],
          commands: {
            paintStable: [1, 'FrameEnvironment.isPaintingStable', []],
            divText: [
              1,
              'FrameEnvironment.execJsPath',
              [['document', ['querySelector', '#div1'], 'textContent']],
            ],
          },
        },
      );
      await hasDiv;
      simulateScriptSendingCommandMeta(session, 3);
      await tab.removeRemoteEventListener(result.listenerId);

      simulateScriptSendingCommandMeta(session, 4);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', '#div1']] },
      ]);
      expect(playInteractionSpy).toHaveBeenCalledTimes(1);
    }
    {
      const { session, tab } = await createSession({
        sessionKeepAlive: true,
        sessionResume: {
          sessionId,
          startLocation: 'currentLocation',
        },
      });

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/resumeAwaitedEvents`);

      simulateScriptSendingCommandMeta(session, 2);
      const hasDiv = new Resolvable<void>();
      const result = await tab.addRemoteEventListener(
        'dom-state',
        (listenerId: string, status: IDomStateResult) => {
          if (result.listenerId === listenerId) {
            if (status.divText?.value === 'div 1' && status.paintStable === true) hasDiv.resolve();
          }
        },
        ['dom-state', 1],
        {
          callsite: 'callsite',
          states: ['states'],
          commands: {
            paintStable: [1, 'FrameEnvironment.isPaintingStable', []],
            divText: [
              1,
              'FrameEnvironment.execJsPath',
              [['document', ['querySelector', '#div1'], 'textContent']],
            ],
          },
        },
      );
      await hasDiv;
      simulateScriptSendingCommandMeta(session, 3);
      await tab.removeRemoteEventListener(result.listenerId);

      simulateScriptSendingCommandMeta(session, 4);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', '#div1']] },
      ]);

      expect(playInteractionSpy).toHaveBeenCalledTimes(1);

      expect(session.commands.history).toHaveLength(8);

      // should reuse the commands from only the first one
      expect(session.commands.history.filter(x => x.reusedCommandFromRun === 0)).toHaveLength(4);
    }
  });
});

describe('sessionResume tests when resume location is sessionStart', () => {
  test('should restart a session within a currently open browserContext', async () => {
    playInteractionSpy.mockClear();
    let counter = 1;
    koaServer.get('/sessionResumeSessionStart', ctx => {
      ctx.cookies.set(`Cookie${counter}`, 'This is a test', {
        httpOnly: true,
      });
      counter += 1;
      ctx.body = `<body><h1>title</h1></body>`;
    });
    let sessionId: string;
    let firstTabPageId: string;
    let profile: IUserProfile;

    {
      const { session, tab } = await createSession({ sessionKeepAlive: true });
      sessionId = session.id;
      firstTabPageId = tab.puppetPage.id;

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionResumeSessionStart`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
      ]);

      expect(playInteractionSpy).toHaveBeenCalledTimes(1);
      profile = await session.exportUserProfile();
    }
    {
      playInteractionSpy.mockClear();
      const { session, tab } = await createSession({
        sessionKeepAlive: true,
        sessionResume: {
          sessionId,
          startLocation: 'sessionStart',
        },
      });

      expect(session.id).toBe(sessionId);
      expect(tab.puppetPage.id).not.toBe(firstTabPageId);

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionResumeSessionStart`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
      ]);

      expect(playInteractionSpy).toHaveBeenCalledTimes(1);
      expect(
        session.commands.history.filter(x => x.reusedCommandFromRun === undefined && x.run === 1),
      ).toHaveLength(2);
      const newProfile = await session.exportUserProfile();
      expect(newProfile.userAgentString).toBe(profile.userAgentString);
      expect(newProfile.deviceProfile).toEqual(profile.deviceProfile);
      expect(newProfile.cookies).not.toEqual(profile.cookies);
      expect(newProfile.cookies.filter(x => x.name === 'Cookie1')).toHaveLength(0);
      expect(newProfile.cookies.filter(x => x.name === 'Cookie2')).toHaveLength(1);
    }
  });

  test('should restart a session with a closed session', async () => {
    playInteractionSpy.mockClear();
    let counter = 1;
    koaServer.get('/sessionResumeSessionStartClosed', ctx => {
      ctx.cookies.set(`Cookie${counter}`, 'This is a test', {
        httpOnly: true,
      });
      counter += 1;
      ctx.body = `<body><h1>title</h1></body>`;
    });
    let sessionId: string;
    let firstTabPageId: string;
    let profile: IUserProfile;

    {
      const { session, tab } = await createSession({
        sessionKeepAlive: true,
        locale: 'de',
        userProfile: {
          cookies: [
            {
              sameSite: 'None',
              name: 'CookieRestore',
              value: 'true',
              domain: 'localhost',
              path: '/',
              expires: '-1',
              httpOnly: true,
              secure: false,
            },
          ],
        },
      });
      sessionId = session.id;
      firstTabPageId = tab.puppetPage.id;

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionResumeSessionStartClosed`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
      ]);

      expect(playInteractionSpy).toHaveBeenCalledTimes(1);
      profile = await session.exportUserProfile();
      expect(profile.cookies).toHaveLength(2);
      await session.close(true);
    }
    {
      playInteractionSpy.mockClear();
      const { session, tab } = await createSession({
        sessionKeepAlive: true,
        sessionResume: {
          sessionId,
          startLocation: 'sessionStart',
        },
      });

      // should be a new session this time
      expect(session.id).not.toBe(sessionId);
      expect(tab.puppetPage.id).not.toBe(firstTabPageId);

      simulateScriptSendingCommandMeta(session, 1);
      await tab.goto(`${koaServer.baseUrl}/sessionResumeSessionStartClosed`);

      simulateScriptSendingCommandMeta(session, 2);
      await tab.interact([
        { command: 'move', mousePosition: ['document', ['querySelector', 'h1']] },
      ]);

      expect(playInteractionSpy).toHaveBeenCalledTimes(1);
      expect(session.commands.history).toHaveLength(2);
      expect(
        session.commands.history.filter(x => x.reusedCommandFromRun !== undefined),
      ).toHaveLength(0);

      const meta = await session.getHeroMeta();
      expect(meta.locale).toBe('de');

      const newProfile = await session.exportUserProfile();
      expect(newProfile.userAgentString).toBe(profile.userAgentString);
      expect(newProfile.deviceProfile).toEqual(profile.deviceProfile);
      expect(newProfile.cookies).not.toEqual(profile.cookies);
      expect(newProfile.cookies.filter(x => x.name === 'Cookie1')).toHaveLength(0);
      expect(newProfile.cookies.filter(x => x.name === 'Cookie2')).toHaveLength(1);
      expect(newProfile.cookies.filter(x => x.name === 'CookieRestore')).toHaveLength(1);
    }
  });

  test('should throw an error if a session is not available to resume', async () => {
    await expect(
      createSession({
        sessionKeepAlive: true,
        sessionResume: {
          sessionId: 'notreal',
          startLocation: 'sessionStart',
        },
      }),
    ).rejects.toThrowError();
  });
});

function simulateScriptSendingCommandMeta(session: Session, id: number): void {
  session.commands.nextCommandMeta = {
    commandId: id,
    startDate: new Date(),
    sendDate: new Date(),
  };
}

async function createSession(
  options?: ISessionCreateOptions,
): Promise<{ session: Session; tab: Tab }> {
  const meta = await connectionToClient.createSession(options);
  const tab = Session.getTab(meta);
  Helpers.onClose(() => tab.session.close(true));
  return { session: tab.session, tab };
}
