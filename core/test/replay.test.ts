import { Helpers } from '@ulixee/hero-testing';
import { InteractionCommand } from '@ulixee/hero-interfaces/IInteractions';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import { createPromise } from '@ulixee/commons/lib/utils';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import { IDomChangeRecord } from '../models/DomChangesTable';
import ConnectionToReplay from "../connections/ConnectionToReplay";
import Core, { Session } from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Replay API tests', () => {
  it('should be able to subscribe to changes', async () => {
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
    await Core.start();
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession();

    const commandMap: { [id: string]: ICommandWithResult } = {};
    const paintMap: { [timestamp: number]: IDomChangeRecord[] } = {};
    const gotCommandsPromise = createPromise();

    const onReplayMessage = async message => {
      const { event, data } = JSON.parse(message.toString());
      if (event === 'commands') {
        for (const command of data) {
          commandMap[command.id] = command;
        }
        if (Object.keys(commandMap).length >= 8) {
          gotCommandsPromise.resolve();
        }
      } else if (event === 'dom-changes') {
        for (const change of data) {
          if (!paintMap[change.timestamp]) paintMap[change.timestamp] = [];
          paintMap[change.timestamp].push(change);
        }
      }
    };

    const connectionToReplay = new ConnectionToReplay(onReplayMessage, {
      dataLocation: meta.sessionsDataLocation,
      sessionId: meta.sessionId,
    } as any);
    const requestReplayPromise = connectionToReplay.handleRequest();
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/test1`);
    await tab.waitForLoad('PaintingStable');
    await new Promise(resolve => setTimeout(resolve, 100));
    await tab.interact([
      {
        command: InteractionCommand.type,
        keyboardCommands: [{ string: 'test' }],
        mousePosition: ['window', 'document', ['querySelector', 'input']],
      },
    ]);
    await tab.waitForElement(['document', ['querySelector', 'a']]);
    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);
    await tab.waitForMillis(100);
    await tab.waitForLoad('PaintingStable');
    const location = await tab.execJsPath(['location', 'href']);
    expect(location.value).toBe(`${koaServer.baseUrl}/test2`);


    await gotCommandsPromise.promise;

    const commands = Object.values(commandMap);
    const firstCommand = commands[0];
    expect(firstCommand.name).toBe('goto');
    expect(commands[1].label).toBe('waitForLoad("PaintingStable")');

    const paintEvents = Object.values(paintMap);
    expect(paintEvents[0]).toHaveLength(14);

    await Core.shutdown();
    await requestReplayPromise;
    connectionToReplay.close();
  }, 20e3);
});
