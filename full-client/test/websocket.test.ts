import { Helpers } from '@ulixee/testing';
import MitmServer from '@ulixee/hero-mitm/lib/MitmProxy';
import { createPromise } from '@ulixee/commons/utils';
import * as WebSocket from 'ws';
import HttpUpgradeHandler from '@ulixee/hero-mitm/handlers/HttpUpgradeHandler';
import WebsocketResource from '@ulixee/hero/lib/WebsocketResource';
import { ITestKoaServer } from '@ulixee/testing/helpers';
import { AddressInfo } from 'net';
import Core from '@ulixee/hero-core/index';
import { Handler } from '../index';

let handler: Handler;
let koaServer: ITestKoaServer;
beforeAll(async () => {
  await Core.start();
  handler = new Handler({ host: await Core.server.address });
  Helpers.onClose(() => handler.close(), true);
  koaServer = await Helpers.runKoaServer();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('Websocket tests', () => {
  it('can wait for a websocket', async () => {
    const mitmServer = await MitmServer.start();
    const upgradeSpy = jest.spyOn(HttpUpgradeHandler.prototype, 'onUpgrade');
    Helpers.needsClosing.push(mitmServer);

    const serverMessagePromise = createPromise();
    const wss = new WebSocket.Server({ noServer: true });

    const receivedMessages: string[] = [];
    koaServer.server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, async (ws: WebSocket) => {
        ws.on('message', msg => {
          receivedMessages.push(msg.toString());
          if (msg === 'Echo Message19') {
            serverMessagePromise.resolve();
          }
        });
        for (let i = 0; i < 20; i += 1) {
          ws.send(`Message${i}`);
          await new Promise(setImmediate);
        }
      });
    });

    koaServer.get('/ws-test', async ctx => {
      ctx.body = `
<html lang="en">
  <body>
  <h1>Here we go</h1>
  </body>
  <script>
    const ws = new WebSocket('ws://localhost:${(koaServer.server.address() as AddressInfo).port}');
    ws.onmessage = msg => {
      ws.send('Echo ' + msg.data);
    };
    let hasRun = false;
    document.addEventListener('mousemove', () => {
      if (hasRun) return;
      hasRun = true;
      ws.send('Final message');
    })
  </script>
</html>`;
    });
    const hero = await handler.createHero();

    await hero.goto(`${koaServer.baseUrl}/ws-test`);

    await hero.waitForElement(hero.document.querySelector('h1'));
    await serverMessagePromise.promise;
    expect(receivedMessages).toHaveLength(20);

    expect(upgradeSpy).toHaveBeenCalledTimes(1);

    const resources = await hero.waitForResource({ type: 'Websocket' });
    expect(resources).toHaveLength(1);

    const [wsResource] = resources as WebsocketResource[];

    const broadcast = createPromise();
    let messagesCtr = 0;
    await wsResource.on('message', message => {
      messagesCtr += 1;
      if (message.message === 'Final message') {
        broadcast.resolve();
      }
    });
    await hero.interact({ move: [10, 10] });
    await broadcast.promise;
    expect(messagesCtr).toBe(41);

    await hero.close();
  });
});
