import SecretAgent from '../index';
import { Helpers } from '@secret-agent/testing';
import MitmServer from '@secret-agent/mitm/lib/MitmProxy';
import { createPromise } from '@secret-agent/commons/utils';
import WebSocket from 'ws';
import MitmRequestHandler from '@secret-agent/mitm/lib/MitmRequestHandler';
import WebsocketResource from '@secret-agent/client/lib/WebsocketResource';

let koaServer;
beforeAll(async () => {
  await SecretAgent.start();
  koaServer = await Helpers.runKoaServer();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('Websocket tests', () => {
  it('can wait for a websocket', async () => {
    const mitmServer = await MitmServer.start(9004);
    const upgradeSpy = jest.spyOn(MitmRequestHandler.prototype, 'handleUpgrade');
    Helpers.needsClosing.push(mitmServer);

    const serverMessagePromise = createPromise();
    const wss = new WebSocket.Server({ noServer: true });

    let receivedMessages = 0;
    koaServer.server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, async (ws: WebSocket) => {
        ws.on('message', msg => {
          receivedMessages += 1;
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
    const ws = new WebSocket('ws://localhost:${koaServer.server.address().port}');
    ws.onmessage = msg => {
      ws.send('Echo ' + msg.data);
    };
    setTimeout(() => {
      ws.send('Final message');
    }, 1e3);
  </script>
</html>`;
    });
    const browser = await SecretAgent.createBrowser();

    await browser.goto(`${koaServer.baseUrl}/ws-test`);

    await browser.waitForElement(browser.document.querySelector('h1'));
    await serverMessagePromise.promise;
    expect(receivedMessages).toBe(20);

    expect(upgradeSpy).toHaveBeenCalledTimes(1);

    const resources = await browser.waitForResource({ type: 'Websocket' });
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
    await broadcast.promise;
    expect(messagesCtr).toBe(41);

    await browser.close();
  });
});
