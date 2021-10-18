import { Helpers } from '@ulixee/hero-testing';
import { InteractionCommand } from '@ulixee/hero-interfaces/IInteractions';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Core, { Session, Tab } from '@ulixee/hero-core';
import ConnectionToClient from '@ulixee/hero-core/connections/ConnectionToClient';
import InjectedScripts from '@ulixee/hero-core/lib/InjectedScripts';
import DomChangesTable from '@ulixee/hero-core/models/DomChangesTable';
import { inspect } from 'util';
import MirrorContext from '../lib/MirrorContext';
import MirrorPage from '../lib/MirrorPage';
import MirrorNetwork from '../lib/MirrorNetwork';

inspect.defaultOptions.depth = 5;
let koaServer: ITestKoaServer;
let connectionToClient: ConnectionToClient;
beforeAll(async () => {
  connectionToClient = Core.addConnection();
  Helpers.onClose(() => connectionToClient.disconnect(), true);
  koaServer = await Helpers.runKoaServer();
  koaServer.get('/empty', ctx => {
    ctx.body = `<html></html>`;
  });
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('MirrorPage tests', () => {
  it('can build from dom recordings', async () => {
    koaServer.get('/test1', ctx => {
      ctx.body = `<body>
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
    const tab = Session.getTab(meta);
    tab.session.options.showBrowserInteractions = true;
    await InjectedScripts.installInteractionScript(tab.puppetPage);
    await tab.goto(`${koaServer.baseUrl}/test1`);
    await tab.waitForLoad('DomContentLoaded');

    const mirrorPage = await createMirrorPage(tab);

    const sourceHtml = await tab.puppetPage.mainFrame.html();

    await mirrorPage.load();

    const mirrorHtml = await mirrorPage.page.mainFrame.html();
    const replayNode = '<hero-replay style="z-index: 2147483647;"></hero-replay>';
    // source should have a replay node that should not be rebuilt in mirror
    expect(mirrorHtml).not.toBe(sourceHtml);
    expect(mirrorHtml).toBe(sourceHtml.replace(replayNode, ''));

    let lastCommandId = tab.lastCommandId;
    async function compareTabsAfterEvaluate(evaluateScript: string) {
      await tab.getJsValue(evaluateScript);
      const pageChangesByFrame = await tab.getDomChanges(tab.mainFrameId, lastCommandId);
      lastCommandId = tab.lastCommandId;
      const domRecordingUpdates = DomChangesTable.toDomRecording(
        pageChangesByFrame,
        new Set([tab.mainFrameId]),
        tab.session.db.frames.frameDomNodePathsById,
      );
      await mirrorPage.updateDomRecording(domRecordingUpdates);
      await mirrorPage.load();

      const sourceHtmlNext = await tab.puppetPage.mainFrame.html();
      const mirrorHtmlNext = await mirrorPage.page.mainFrame.html();
      // mirror page should not know about the hero-replay nodes
      expect(mirrorHtmlNext).not.toBe(sourceHtmlNext);
      expect(mirrorHtmlNext).toBe(sourceHtmlNext.replace(replayNode, ''));
    }

    // 1. Append list
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
  });

  it('should support multiple tabs', async () => {
    koaServer.get('/tab1', ctx => {
      ctx.body = `<body>
<div>
    <h1>This is the starting point</h1>
    <ul>
        <li>1</li>
    </ul>
    <a href="/tab2" target="_blank">Clickeroo</a>
</div>
</body>`;
    });
    koaServer.get('/tab2', ctx => {
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
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/tab1`);
    await tab.waitForLoad('DomContentLoaded');

    const mirrorPage = await createMirrorPage(tab);

    const sourceHtml = await tab.puppetPage.mainFrame.html();

    await mirrorPage.load();

    {
      const changes = await tab.getDomChanges();
      expect(changes).toHaveLength(21);

      const domRecordingUpdates = DomChangesTable.toDomRecording(
        changes,
        new Set([tab.mainFrameId]),
        tab.session.db.frames.frameDomNodePathsById,
      );
      await mirrorPage.updateDomRecording(domRecordingUpdates);
      await mirrorPage.load();
    }

    const mirrorHtml = await mirrorPage.page.mainFrame.html();
    expect(mirrorHtml).toBe(sourceHtml);

    await tab.interact([
      {
        command: InteractionCommand.click,
        mousePosition: ['window', 'document', ['querySelector', 'a']],
      },
    ]);
    const newTab = await tab.waitForNewTab();
    await newTab.waitForLoad('PaintingStable');
    const newTabHtml = await newTab.puppetPage.mainFrame.html();
    const pageChanges = await newTab.getDomChanges();
    expect(pageChanges.length).toBeGreaterThan(10);

    const newTabMirrorPage = await createMirrorPage(newTab);
    await newTabMirrorPage.load();

    const mirrorNewTabHtml = await newTabMirrorPage.page.mainFrame.html();
    expect(mirrorNewTabHtml).toBe(newTabHtml);
  }, 45e3);
});

async function createMirrorPage(tab: Tab, isDebug = false): Promise<MirrorPage> {
  const mirrorContext = await MirrorContext.createFromSessionDb(tab.session.id, false);
  Helpers.needsClosing.push(mirrorContext);
  const mainPageChanges = await tab.getDomChanges();
  const domRecording = DomChangesTable.toDomRecording(
    mainPageChanges,
    new Set([tab.mainFrameId]),
    tab.session.db.frames.frameDomNodePathsById,
  );

  const mirrorPage = new MirrorPage(new MirrorNetwork(), domRecording, false, isDebug);
  await mirrorPage.open(mirrorContext, tab.sessionId);
  Helpers.needsClosing.push(mirrorPage);
  return mirrorPage;
}
