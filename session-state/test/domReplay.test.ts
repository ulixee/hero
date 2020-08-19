import Core, { Window } from '@secret-agent/core';
import { Helpers } from '@secret-agent/testing';
import ChromeCore from '@secret-agent/core/lib/ChromeCore';
import * as fs from 'fs';
import { InteractionCommand } from '@secret-agent/core-interfaces/IInteractions';
import DomChangesTable from '../models/DomChangesTable';

const domReplayScript = fs.readFileSync(
  require.resolve('@secret-agent/replay-app/injected-scripts/domReplayer'),
  'utf8',
);

let koaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer();
});

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
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.goto(`${koaServer.baseUrl}/test1`);
    await core.waitForLoad('DomContentLoaded');
    // @ts-ignore
    const window: Window = core.window;

    const mirrorChrome = new ChromeCore();
    await mirrorChrome.start();
    Helpers.onClose(() => mirrorChrome.close());

    // @ts-ignore
    const puppBrowser = await mirrorChrome.getBrowser();
    const mirrorPage = await puppBrowser.newPage();
    const debug = false;
    if (debug) {
      mirrorPage.on('console', x => console.log(x.text()));
      mirrorPage.on('pageerror', x => console.log(x));
    }
    await mirrorPage.evaluateOnNewDocument(`const exports = {};\n${domReplayScript}`);
    await mirrorPage.goto(`${koaServer.baseUrl}/empty`);

    const sourceHtml = await window.puppPage.content();

    const state = window.sessionState;

    {
      const pageChanges = await state.getPageDomChanges(state.pages.history, true);
      const [changes] = Object.values(pageChanges);
      await mirrorPage.evaluate(
        `window.replayEvents(${JSON.stringify(changes.map(DomChangesTable.toRecord))})`,
      );
    }

    const mirrorHtml = await mirrorPage.content();
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

      const pageChangesByFrame = await state.getPageDomChanges(
        state.pages.history,
        true,
        lastCommandId,
      );
      lastCommandId = core.lastCommandId;
      const [changes] = Object.values(pageChangesByFrame);
      await mirrorPage.evaluate(
        `window.replayEvents(${JSON.stringify(changes.map(DomChangesTable.toRecord))})`,
      );

      const sourceHtmlNext = await window.puppPage.content();
      const mirrorHtmlNext = await mirrorPage.content();
      expect(mirrorHtmlNext).toBe(sourceHtmlNext);
    }
  });
});

afterAll(async () => {
  await Core.shutdown();
  await Helpers.closeAll();
});
