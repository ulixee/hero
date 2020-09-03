import Core, { Tab } from '@secret-agent/core';
import { Helpers } from '@secret-agent/testing';
import ChromeCore from '@secret-agent/core/lib/ChromeCore';
import * as fs from 'fs';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import DomChangesTable from '../models/DomChangesTable';

const domReplayScript = fs.readFileSync(
  require.resolve('@secret-agent/replay-app/injected-scripts/domReplayer'),
  'utf8',
);

const getContentScript = `(() => {
  let retVal = '';
  if (document.doctype)
    retVal = new XMLSerializer().serializeToString(document.doctype);
  if (document.documentElement)
    retVal += document.documentElement.outerHTML;
  return retVal;
})()`;

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Dom Replay tests', () => {
  it('basic replay test', async () => {
    koaServer.get('/test1', ctx => {
      ctx.body = `<body>
<div>
    <h1>This is the starting point</h1>
    <ul>
        <li>1</li>
    </ul>
    <a href="#" onclick="clicky()">Clickeroo</a>
</div>
<div id="div2"></div>
<script>
 let clicks = 0;
 const child = document.createElement('li');
 const child2 = document.createElement('li');
 const child3 = document.createElement('li');
 const parent = document.querySelector('ul');
 
 function clicky(){
   clicks += 1;
   
   if (clicks === 1) {
     child.textContent = 'Another one ' + parent.children.length;
     parent.append(child, child2, child3);
   } 
   if (clicks === 2) {
     parent.removeChild(child2);
   }
   if (clicks === 3) {
     parent.append(child);
   }
   if (clicks === 4) {
     document.querySelector('#div2').setAttribute('data', "{ data: true }");
     document.querySelector('#div2').setAttribute('trial', '1');
   }
   if (clicks === 5) {
     child.textContent = 'Li 2';
   }
   if (clicks === 6){
     // test inserting a bunch at once
     const div2 = document.createElement('div');
     div2.innerHTML = "<p>This is para 1</p><br/><p>This is para 2</p>";
     document.body.insertBefore(div2, document.querySelector('script'))
   }
   return false;
 }
</script>
</body>`;
    });
    koaServer.get('/empty', ctx => {
      ctx.body = `<html></html>`;
    });
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];
    await core.goto(`${koaServer.baseUrl}/test1`);
    await core.waitForLoad('DomContentLoaded');
    // @ts-ignore
    const tab: Tab = core.tab;

    // @ts-ignore
    const chromeCorePath = core.session.emulator.engineExecutablePath;
    const mirrorChrome = new ChromeCore(chromeCorePath);
    mirrorChrome.start();
    Helpers.onClose(() => mirrorChrome.close());

    const context = await mirrorChrome.createContext();
    const mirrorPage = await context.newPage();
    const debug = false;
    if (debug) {
      mirrorPage.on('pageError', console.log);
      mirrorPage.on('consoleLog', log => console.log(log));
    }
    await mirrorPage.frames.addNewDocumentScript(`const exports = {};\n${domReplayScript}`, false);
    await mirrorPage.navigate(`${koaServer.baseUrl}/empty`);

    const sourceHtml = await tab.puppetPage.evaluate(getContentScript);

    const state = tab.sessionState;

    {
      await tab.domRecorder.flush();
      const pageChanges = await state.getPageDomChanges(state.pages.history);
      const [changes] = Object.values(pageChanges);
      await mirrorPage.evaluate(
        `window.replayEvents(${JSON.stringify(changes.map(DomChangesTable.toRecord))})`,
      );
    }

    const mirrorHtml = await mirrorPage.evaluate(getContentScript);
    expect(mirrorHtml).toBe(sourceHtml);

    let lastCommandId = core.lastCommandId;
    for (let i = 1; i <= 6; i += 1) {
      await core.interact([
        {
          command: InteractionCommand.click,
          mousePosition: ['window', 'document', ['querySelector', 'a']],
        },
      ]);

      await new Promise(resolve => setTimeout(resolve, 100));

      await tab.domRecorder.flush();
      const pageChangesByFrame = await state.getPageDomChanges(state.pages.history, lastCommandId);
      lastCommandId = core.lastCommandId;
      const [changes] = Object.values(pageChangesByFrame);
      await mirrorPage.evaluate(
        `window.replayEvents(${JSON.stringify(changes.map(DomChangesTable.toRecord))})`,
      );

      const sourceHtmlNext = await tab.puppetPage.evaluate(getContentScript);
      const mirrorHtmlNext = await mirrorPage.evaluate(getContentScript);
      expect(mirrorHtmlNext).toBe(sourceHtmlNext);
    }
  });
});
