"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const MitmProxy_1 = require("@ulixee/unblocked-agent-mitm/lib/MitmProxy");
const utils_1 = require("@ulixee/commons/lib/utils");
const WebSocket = require("ws");
const HttpUpgradeHandler_1 = require("@ulixee/unblocked-agent-mitm/handlers/HttpUpgradeHandler");
const hero_core_1 = require("@ulixee/hero-core");
let koaServer;
beforeAll(async () => {
    hero_testing_1.Helpers.onClose(() => hero_core_1.default.shutdown(), true);
    koaServer = await hero_testing_1.Helpers.runKoaServer();
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('Websocket tests', () => {
    it('can wait for a websocket', async () => {
        const mitmServer = await MitmProxy_1.default.start(null);
        const upgradeSpy = jest.spyOn(HttpUpgradeHandler_1.default.prototype, 'onUpgrade');
        hero_testing_1.Helpers.needsClosing.push(mitmServer);
        const serverMessagePromise = (0, utils_1.createPromise)();
        const wss = new WebSocket.Server({ noServer: true });
        const receivedMessages = [];
        koaServer.server.on('upgrade', (request, socket, head) => {
            wss.handleUpgrade(request, socket, head, async (ws) => {
                ws.on('message', msg => {
                    receivedMessages.push(msg.toString());
                    if (msg.toString() === 'Echo Message19') {
                        serverMessagePromise.resolve();
                    }
                });
                for (let i = 0; i < 20; i += 1) {
                    ws.send(`Message${i}`);
                    await new Promise(setImmediate);
                }
            });
        });
        koaServer.get('/ws-test', async (ctx) => {
            ctx.body = `
<html lang="en">
  <body>
  <h1>Here we go</h1>
  </body>
  <script>
    const ws = new WebSocket('ws://localhost:${koaServer.server.address().port}');
    let hasMessage = false;
    ws.onmessage = msg => {
      hasMessage = true;
      ws.send('Echo ' + msg.data);
    };
    let hasRun = false;
    document.addEventListener('mousemove', () => {
      if (hasRun || !hasMessage) return;
      hasRun = true;
      ws.send('Final message');
    })
  </script>
</html>`;
        });
        const hero = new hero_testing_1.Hero();
        await hero.goto(`${koaServer.baseUrl}/ws-test`);
        await hero.waitForElement(hero.document.querySelector('h1'));
        await serverMessagePromise.promise;
        expect(receivedMessages).toHaveLength(20);
        expect(upgradeSpy).toHaveBeenCalledTimes(1);
        const resource = await hero.waitForResource({ type: 'Websocket' });
        const wsResource = resource;
        const broadcast = (0, utils_1.createPromise)();
        let messagesCtr = 0;
        await wsResource.on('message', message => {
            messagesCtr += 1;
            if (message.message.toString() === 'Final message') {
                broadcast.resolve();
            }
        });
        await hero.interact({ move: [10, 10] });
        await broadcast.promise;
        expect(messagesCtr).toBe(41);
        await hero.close();
    });
});
//# sourceMappingURL=websocket.test.js.map