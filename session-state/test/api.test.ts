import Core, { Session } from '@secret-agent/core';
import { Helpers } from '@secret-agent/testing';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import * as http2 from 'http2';
import { http2StreamToJson, ITestKoaServer } from '@secret-agent/testing/helpers';
import { createPromise } from '@secret-agent/commons/utils';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import { IDomChangeRecord } from '../models/DomChangesTable';

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
    await Core.startReplayServer();
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession();

    const api = http2.connect(meta.replayApiServer);
    const commandMap: { [id: string]: ICommandWithResult } = {};
    const paintMap: {
      [timestamp: string]: IDomChangeRecord[];
    } = {};
    const gotCommandsPromise = createPromise();
    api.on('stream', async (stream, headers) => {
      const path = headers[':path'];

      if (path === '/commands') {
        const json = await http2StreamToJson<ICommandWithResult[]>(stream);
        for (const command of json) {
          commandMap[command.id] = command;
        }
        if (Object.keys(commandMap).length >= 8) {
          gotCommandsPromise.resolve();
        }
      } else if (path === '/dom-changes') {
        const json = await http2StreamToJson<IDomChangeRecord[]>(stream);
        for (const change of json) {
          if (!paintMap[change.timestamp]) paintMap[change.timestamp] = [];
          paintMap[change.timestamp].push(change);
        }
      }
    });
    api.request({
      ':path': `/`,
      'data-location': meta.sessionsDataLocation,
      'session-id': meta.sessionId,
    });
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/test1`);
    await tab.waitForLoad('AllContentLoaded');
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
    await tab.waitForLoad('AllContentLoaded');
    const location = await tab.execJsPath(['location', 'href']);
    expect(location.value).toBe(`${koaServer.baseUrl}/test2`);

    await gotCommandsPromise.promise;

    const commands = Object.values(commandMap);
    const firstCommand = commands[0];
    expect(firstCommand.name).toBe('goto');
    expect(commands[1].label).toBe('waitForLoad("AllContentLoaded")');

    // 1 is just the new document
    const paintEvents = Object.values(paintMap);
    expect(paintEvents[0]).toHaveLength(1);
    expect(paintEvents[1]).toHaveLength(14);

    await Core.shutdown(true);
    api.destroy();
  }, 20e3);
});
