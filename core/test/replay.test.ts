import Core, { Session } from '@ulixee/hero-core';
import { Helpers } from '@ulixee/testing';
import { InteractionCommand } from '@ulixee/hero-interfaces/IInteractions';
import * as WebSocket from 'ws';
import { ITestKoaServer } from '@ulixee/testing/helpers';
import { createPromise } from '@ulixee/commons/utils';
import Output from '@ulixee/hero/lib/Output';
import ReplayOutput from '@ulixee/replay/backend/api/ReplayOutput';
import ObjectObserver from '@ulixee/hero/lib/ObjectObserver';
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
    await Core.start();
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    const meta = await connection.createSession();

    const api = new WebSocket(`${await Core.server.address}/replay`, {
      headers: {
        'data-location': meta.sessionsDataLocation,
        'session-id': meta.sessionId,
      },
    });
    const commandMap: { [id: string]: ICommandWithResult } = {};
    const paintMap: {
      [timestamp: number]: IDomChangeRecord[];
    } = {};
    const gotCommandsPromise = createPromise();
    api.on('message', async message => {
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
    });
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

    await Core.shutdown(true);
    if (api.readyState === WebSocket.OPEN) api.terminate();
  }, 20e3);

  it('should be able to rebuild an output', async () => {
    const observable = new ObjectObserver(new Output());

    const clientOutput = observable.proxy;
    const replayOutput = new ReplayOutput();
    let id = 0;
    observable.onChanges = changes => {
      const changesToRecord = changes.map(change => ({
        type: change.type,
        value: JSON.stringify(change.value),
        path: JSON.stringify(change.path),
        lastCommandId: id,
        timestamp: new Date().getTime(),
      }));
      replayOutput.onOutput(changesToRecord);
    };

    clientOutput.test = 1;
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    clientOutput.sub = { nested: true, str: 'test', num: 1 };
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    delete clientOutput.sub.num;
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    delete clientOutput.sub;
    delete clientOutput.test;
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    clientOutput.array = [{ test: 1 }, { test: 2 }, { test: 3 }];
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    clientOutput.array.splice(1, 1);
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    clientOutput.array.push({ test: 0 });
    clientOutput.array.sort((a, b) => {
      return a.test - b.test;
    });
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());
  });
});
