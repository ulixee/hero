"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const hero_core_1 = require("@ulixee/hero-core");
const InjectedScripts_1 = require("@ulixee/hero-core/lib/InjectedScripts");
const DomChangesTable_1 = require("@ulixee/hero-core/models/DomChangesTable");
const util_1 = require("util");
const MirrorContext_1 = require("../lib/MirrorContext");
const MirrorPage_1 = require("../lib/MirrorPage");
const MirrorNetwork_1 = require("../lib/MirrorNetwork");
util_1.inspect.defaultOptions.depth = 5;
let koaServer;
let connectionToClient;
let core;
beforeAll(async () => {
    core = await hero_core_1.default.start();
    connectionToClient = core.addConnection();
    hero_testing_1.Helpers.onClose(() => connectionToClient.disconnect(), true);
    koaServer = await hero_testing_1.Helpers.runKoaServer();
    koaServer.get('/empty', ctx => {
        ctx.body = `<html></html>`;
    });
});
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('MirrorPage tests', () => {
    it('can build from dom recordings', async () => {
        koaServer.get('/domrecording', ctx => {
            ctx.body = `<!DOCTYPE html>
<!--[if lt IE 7]> <html lang="en-us" class="lt-ie11 lt-ie10 lt-ie9 lt-ie8 lt-ie7 lots"> <![endif]-->
<!--[if IE 7]> <html lang="en-us" class="lt-ie11 lt-ie10 lt-ie9 lt-ie8 lots"> <![endif]-->
<!--[if gt IE 9]><!-->
<html class="page html context lots" lang="en-us">
<!--<![endif]-->
<head><title>Dom Recording</title></head>
<body>
<div>
    <h1>This is the starting point</h1>
    <ul>
        <li>1</li>
    </ul>
    <input name="test"/>
    <a href="#" onclick="clicky()">Clickeroo</a>
    <ul id="ul2"></ul>
</div>
<div id="div2"></div>
<script>
  document.querySelector('input').value = '1';
  var child = document.createElement('li');
  var child2 = document.createElement('li');
  var child3 = document.createElement('li');
  var parent = document.querySelector('ul');
</script>
</body>`;
        });
        const meta = await connectionToClient.createSession();
        const tab = hero_core_1.Session.getTab(meta);
        hero_testing_1.Helpers.needsClosing.push(tab.session);
        tab.session.options.showChromeInteractions = true;
        await InjectedScripts_1.default.installInteractionScript(tab.page);
        await tab.goto(`${koaServer.baseUrl}/domrecording`);
        await tab.waitForLoad('DomContentLoaded');
        const mirrorPage = await createMirrorPage(tab);
        const sourceHtml = await tab.page.mainFrame.outerHTML();
        await mirrorPage.load();
        {
            const mirrorHtml = await mirrorPage.outerHTML();
            expect(mirrorHtml).toBe(sourceHtml);
        }
        const htmlAtSteps = [];
        async function compareTabsAfterEvaluate(evaluateScript) {
            await tab.getJsValue(evaluateScript);
            await mirrorPage.load();
            const sourceHtmlNext = await tab.page.mainFrame.outerHTML();
            htmlAtSteps.push({
                html: sourceHtmlNext,
                // @ts-ignore
                index: mirrorPage.domRecording.paintEvents.length - 1,
            });
            const mirrorHtmlNext = await mirrorPage.outerHTML();
            // mirror page should not know about the hero-replay nodes
            expect(mirrorHtmlNext).toBe(sourceHtmlNext);
        }
        // Append list
        await compareTabsAfterEvaluate(`
        document.body.classList.add('test1');
        document.head.classList.add('head1');
    `);
        // Append list
        await compareTabsAfterEvaluate(`
        child.textContent = 'Another one ' + parent.children.length;
        parent.append(child, child2, child3);
    `);
        // remove child
        await compareTabsAfterEvaluate(`parent.removeChild(child2);`);
        // add new child
        await compareTabsAfterEvaluate(`parent.append(child);`);
        // set attributes
        await compareTabsAfterEvaluate(`
        document.querySelector('#div2').setAttribute('data', '{ data: true }');
        document.querySelector('#div2').setAttribute('trial', '1');
    `);
        // text content
        await compareTabsAfterEvaluate(`child.textContent = 'Li 2';`);
        // test inserting a bunch at once
        await compareTabsAfterEvaluate(`
        const div2 = document.createElement('div');
        div2.innerHTML = '<p>This is para 1</p><br/><p>This is para 2</p>';
        document.body.insertBefore(div2, document.querySelector('script'));`);
        // add element to end of page
        await compareTabsAfterEvaluate(`document.body.appendChild(document.createElement('div'));`);
        // ensure replay node doesn't get in the way
        await compareTabsAfterEvaluate(`
        const div = document.createElement('div');
        div.id = 'after-script';
        div.innerHTML = '<p>This is para 1</p><br/><p>This is para 2</p>';
        const last = document.body.children.item(document.body.children.length - 1);
        document.body.insertBefore(div, last);
    `);
        // remove all lis
        await compareTabsAfterEvaluate(`
      child.remove();
      child3.remove();
    `);
        // try to reparent elements
        await compareTabsAfterEvaluate(`
      const ul2 = document.querySelector('#ul2');
      ul2.append(child, child2, child3);
    `);
        htmlAtSteps.reverse();
        for (const { index, html } of htmlAtSteps) {
            await mirrorPage.load(index);
            const mirrorHtml = await mirrorPage.page.mainFrame.outerHTML();
            expect(mirrorHtml).toBe(html);
        }
    });
    it('should support multiple tabs', async () => {
        koaServer.get('/dr-tab1', ctx => {
            ctx.body = `<body>
<div>
    <h1>This is the starting point</h1>
    <ul>
        <li>1</li>
    </ul>
    <a href="/dr-tab2" target="_blank">Clickeroo</a>
</div>
</body>`;
        });
        koaServer.get('/dr-tab2', ctx => {
            ctx.body = `
<html>
<head>
  <script type="text/javascript">
  (() => {
    console.log('Ran!');
  })();
</script>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=Edge">
  <title>Dom Replay Test</title>
</head>
<body>
<div>
    <h1>This is tab 2</h1>
</div>
</body>
</html>`;
        });
        const meta = await connectionToClient.createSession();
        const tab = hero_core_1.Session.getTab(meta);
        hero_testing_1.Helpers.needsClosing.push(tab.session);
        await tab.goto(`${koaServer.baseUrl}/dr-tab1`);
        await tab.waitForLoad('DomContentLoaded');
        const mirrorPage = await createMirrorPage(tab);
        const sourceHtml = await tab.page.mainFrame.outerHTML();
        await mirrorPage.load();
        {
            const changes = await tab.getDomChanges();
            expect(changes).toHaveLength(21);
        }
        const mirrorHtml = await mirrorPage.page.mainFrame.outerHTML();
        expect(mirrorHtml).toBe(sourceHtml);
        await tab.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: ['window', 'document', ['querySelector', 'a']],
            },
        ]);
        const newTab = await tab.waitForNewTab();
        await newTab.waitForLoad('PaintingStable');
        const newTabHtml = await newTab.page.mainFrame.outerHTML();
        const pageChanges = await newTab.getDomChanges();
        expect(pageChanges.length).toBeGreaterThan(10);
        const newTabMirrorPage = await createMirrorPage(newTab);
        await newTabMirrorPage.load();
        const mirrorNewTabHtml = await newTabMirrorPage.page.mainFrame.outerHTML();
        expect(mirrorNewTabHtml).toBe(newTabHtml);
    }, 45e3);
    it('can replay data attributes', async () => {
        koaServer.get('/data-attr', ctx => {
            ctx.body = `<body>
<div>
    <h1>This is the starting point</h1>
    <a href="#" onclick="clicker()">click</a>
    <span id="tester" class="a-declarative" data-action="open-sheet:style_name">test</span>
</div>
<script>

 function clicker(){
   document.querySelector('div').setAttribute('data-sheet:style_name',"{}");
   return false;
 }
</script>
</body>`;
        });
        const meta = await connectionToClient.createSession();
        const tab = hero_core_1.Session.getTab(meta);
        hero_testing_1.Helpers.needsClosing.push(tab.session);
        await tab.goto(`${koaServer.baseUrl}/data-attr`);
        await tab.waitForLoad('DomContentLoaded');
        const mirrorPage = await createMirrorPage(tab);
        const sourceHtml = await tab.page.mainFrame.outerHTML();
        await mirrorPage.load();
        const mirrorHtml = await mirrorPage.page.mainFrame.outerHTML();
        expect(mirrorHtml).toBe(sourceHtml);
        const lastCommandId = tab.lastCommandId;
        await tab.interact([
            {
                command: IInteractions_1.InteractionCommand.click,
                mousePosition: ['window', 'document', ['querySelector', 'a']],
            },
        ]);
        const changes = await tab.getDomChanges(tab.mainFrameId, lastCommandId);
        expect(changes.length).toBe(2);
        await mirrorPage.load();
        const mirrorHtml2 = await mirrorPage.page.mainFrame.outerHTML();
        const sourceHtml2 = await tab.page.mainFrame.outerHTML();
        expect(mirrorHtml2).toBe(sourceHtml2);
    }, 45e3);
});
async function createMirrorPage(tab, isDebug = false) {
    const mirrorContext = await MirrorContext_1.default.createFromSessionDb(tab.session.id, core, false);
    hero_testing_1.Helpers.needsClosing.push(mirrorContext);
    const domRecording = DomChangesTable_1.default.toDomRecording(tab.session.db.domChanges.all(), new Set([tab.mainFrameId]), tab.session.db.frames.frameDomNodePathsById);
    const mirrorPage = new MirrorPage_1.default(new MirrorNetwork_1.default({ loadResourceDetails: () => null }), domRecording, false, isDebug);
    await mirrorPage.subscribe(tab);
    await mirrorPage.openInContext(mirrorContext, tab.sessionId);
    hero_testing_1.Helpers.needsClosing.push(mirrorPage);
    return mirrorPage;
}
//# sourceMappingURL=mirrorPage.test.js.map