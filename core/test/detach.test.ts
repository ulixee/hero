import Core, { Session } from '@secret-agent/core';
import { Helpers } from '@secret-agent/testing';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import {
  getComputedVisibilityFnName,
  getNodePointerFnName,
} from '@secret-agent/interfaces/jsPathFnNames';
import INodePointer from 'awaited-dom/base/INodePointer';
import { inspect } from 'util';
import { LocationStatus } from '@secret-agent/interfaces/Location';
import ConnectionToClient from '../server/ConnectionToClient';

inspect.defaultOptions.colors = true;
inspect.defaultOptions.depth = null;
let koaServer: ITestKoaServer;
let connectionToClient: ConnectionToClient;
beforeAll(async () => {
  connectionToClient = Core.addConnection();
  Helpers.onClose(() => connectionToClient.disconnect(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const getContentScript = `(() => {
  let retVal = '';
  if (document.doctype)
    retVal = new XMLSerializer().serializeToString(document.doctype);
  if (document.documentElement)
    retVal += document.documentElement.outerHTML;
  return retVal;
})()`;

describe('basic Detach tests', () => {
  it('can detach a document', async () => {
    const body = `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>Untitled</title>
    <meta name="description" content="This is an example of a meta description.">
    <link rel="stylesheet" type="text/css" href="theme.css">
    <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
  </head>
  <body>
    <form action="submit-to-path" method="get" target="_blank">
       <label for="saddr">Enter your location</label>
       <input type="text" name="saddr">
       <input type="hidden" name="daddr" value="350 5th Ave New York, NY 10018 (Empire State Building)">
       <input type="submit" value="Get directions">
    </form>
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">

</body></html>`;
    koaServer.get('/basic-detach', ctx => {
      ctx.body = body;
    });
    const meta = await connectionToClient.createSession({
      humanEmulatorId: 'skipper',
    });
    const session = Session.get(meta.sessionId);
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/basic-detach`);
    await tab.waitForLoad('DomContentLoaded');

    const bodyAfterLoad = await tab.puppetPage.evaluate(getContentScript);

    const { detachedTab } = await session.detachTab(tab, 'callsite2');
    const detachedContent = await detachedTab.puppetPage.evaluate(getContentScript);

    expect(detachedContent).toBe(bodyAfterLoad);

    const inputs = await detachedTab.execJsPath([
      'document',
      ['querySelectorAll', 'input'],
      [getNodePointerFnName],
    ]);
    expect(inputs.nodePointer.iterableItems).toHaveLength(3);
  });

  it('can record all commands sent to a detached frame', async () => {
    koaServer.get('/nested-detach', ctx => {
      ctx.body = `
        <body>
          <div id="menu1" class="menu">
            <div class="nested">Nested 1</div>
          </div>
          <div id="menu2" class="menu">
            <div class="nested">Nested 2</div>
            <div>Not nested</div>
          </div>
          <div id="menu3" class="menu">
            <div class="nested">Nested 3</div>
          </div>
        </body>`;
    });

    const meta = await connectionToClient.createSession({
      humanEmulatorId: 'skipper',
    });
    const session = Session.get(meta.sessionId);
    const tab = Session.getTab(meta);
    await tab.goto(`${koaServer.baseUrl}/nested-detach`);
    await tab.waitForLoad(LocationStatus.AllContentLoaded);
    const { detachedTab } = await session.detachTab(tab, 'callsite1');

    const execJsPath = jest.spyOn(detachedTab.mainFrameEnvironment.jsPath, 'exec');
    const qsAllResult = await detachedTab.execJsPath([
      'document',
      ['querySelectorAll', '.menu'],
      [getNodePointerFnName],
    ]);
    let counter = 0;
    for (const pointer of qsAllResult.nodePointer.iterableItems as INodePointer[]) {
      counter += 1;
      expect(pointer.type).toBe('HTMLDivElement');
      const idResult = await detachedTab.execJsPath([pointer.id, 'id']);
      expect(idResult.value).toBe(`menu${counter}`);
      const classNameResult = await detachedTab.execJsPath([pointer.id, 'className']);
      expect(classNameResult.value).toBe(`menu`);

      const boundingRect = await detachedTab.execJsPath([pointer.id, ['getBoundingClientRect']]);
      expect(boundingRect.value).toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      });
      const nestedResult = await detachedTab.execJsPath([
        pointer.id,
        ['querySelector', '.nested'],
        [getNodePointerFnName],
      ]);

      await detachedTab.execJsPath([pointer.id, [getComputedVisibilityFnName]]);

      const nestedTextResult = await detachedTab.execJsPath([
        nestedResult.nodePointer.id,
        'textContent',
      ]);
      expect(nestedTextResult.value).toBe(`Nested ${counter}`);
      const nestedClassnameResult = await detachedTab.execJsPath([
        nestedResult.nodePointer.id,
        'className',
      ]);
      expect(nestedClassnameResult.value).toBe(`nested`);
    }
    const jsPaths = detachedTab.mainFrameEnvironment.jsPath.execHistory;

    // now should be able to create a second detached tab and replay the paths with same result
    const { detachedTab: secondDetached } = await session.detachTab(tab, 'callsite3');
    const prefetch = await secondDetached.mainFrameEnvironment.jsPath.runJsPaths(jsPaths);

    const manualResults = [];
    for (let i = 0; i < execJsPath.mock.calls.length; i += 1) {
      const [jsPath] = execJsPath.mock.calls[i];
      const result = await execJsPath.mock.results[i].value;
      manualResults.push({ result, jsPath });
    }

    manualResults.sort((a, b) => {
      return JSON.stringify(a.jsPath).localeCompare(JSON.stringify(b.jsPath));
    });
    prefetch.sort((a, b) => {
      return JSON.stringify(a.jsPath).localeCompare(JSON.stringify(b.jsPath));
    });

    expect(prefetch).toStrictEqual(manualResults);
  });
});
