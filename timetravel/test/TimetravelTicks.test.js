"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_core_1 = require("@ulixee/hero-core");
const index_1 = require("@ulixee/hero-testing/index");
const TimetravelTicks_1 = require("../player/TimetravelTicks");
let koaServer;
let core;
beforeAll(async () => {
    core = new hero_core_1.default();
    index_1.Helpers.onClose(core.close, true);
    koaServer = await index_1.Helpers.runKoaServer();
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
afterEach(index_1.Helpers.afterEach);
afterAll(index_1.Helpers.afterAll);
describe('basic Timetravel Ticks tests', () => {
    let sessionId;
    beforeAll(async () => {
        const connection = core.addConnection();
        index_1.Helpers.onClose(() => connection.disconnect());
        const meta = await connection.createSession({
            scriptInvocationMeta: {
                productId: 'hero',
                workingDirectory: process.cwd(),
                entrypoint: 'testEntrypoint.js',
                version: '1234',
            },
        });
        const tab = hero_core_1.Session.getTab(meta);
        sessionId = meta.sessionId;
        await tab.goto(`${koaServer.baseUrl}/api-test`);
        await tab.waitForLoad('DomContentLoaded');
        await tab.interact([{ command: 'click', mousePosition: ['document', ['querySelector', 'a']] }]);
        await index_1.Helpers.waitForElement(['document', ['querySelector', 'a#link2']], tab.mainFrameEnvironment);
        await tab.session.close();
        await hero_core_1.default.shutdown();
    });
    it('can get the ticks for a session', async () => {
        const sessionDb = await core.sessionRegistry.get(sessionId);
        const timetravelTicks = new TimetravelTicks_1.default(sessionDb);
        const tabDetails = timetravelTicks.load();
        expect(tabDetails).toHaveLength(1);
        expect(tabDetails[0].ticks.length).toBeGreaterThanOrEqual(4);
        expect(tabDetails[0].ticks.filter(x => x.isMajor)).toHaveLength(4);
        expect(tabDetails[0].ticks.filter(x => x.isNewDocumentTick)).toHaveLength(1);
        expect(tabDetails[0].domRecording.paintEvents.length).toBeGreaterThanOrEqual(1);
        expect(tabDetails[0].ticks.filter(x => x.eventType === 'command')).toHaveLength(4);
        expect(tabDetails[0].mouse.length).toBeGreaterThanOrEqual(1);
    });
});
//# sourceMappingURL=TimetravelTicks.test.js.map