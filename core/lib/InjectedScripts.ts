import * as fs from 'fs';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import { stringifiedTypeSerializerClass } from '@ulixee/commons/lib/TypeSerializer';
import injectedSourceUrl from '@ulixee/hero-interfaces/injectedSourceUrl';
import { IFrontendDomChangeEvent } from '../models/DomChangesTable';
import {
  IFrontendMouseEvent,
  IFrontendScrollEvent,
  IHighlightedNodes,
} from '../injected-scripts/interactReplayer';
import { IPaintEvent } from '../apis/Session.ticks';

const pageScripts = {
  domStorage: fs.readFileSync(`${__dirname}/../injected-scripts/domStorage.js`, 'utf8'),
  domReplayer: fs.readFileSync(`${__dirname}/../injected-scripts/domReplayer.js`, 'utf8'),
  interactReplayer: fs.readFileSync(`${__dirname}/../injected-scripts/interactReplayer.js`, 'utf8'),
  NodeTracker: fs.readFileSync(`${__dirname}/../injected-scripts/NodeTracker.js`, 'utf8'),
  jsPath: fs.readFileSync(`${__dirname}/../injected-scripts/jsPath.js`, 'utf8'),
  Fetcher: fs.readFileSync(`${__dirname}/../injected-scripts/Fetcher.js`, 'utf8'),
  MouseEvents: fs.readFileSync(`${__dirname}/../injected-scripts/MouseEvents.js`, 'utf8'),
  pageEventsRecorder: fs.readFileSync(
    `${__dirname}/../injected-scripts/pageEventsRecorder.js`,
    'utf8',
  ),
};
const pageEventsCallbackName = '__heroPageListenerCallback';

const injectedScript = `(function installInjectedScripts() {
    const exports = {}; // workaround for ts adding an exports variable
    ${stringifiedTypeSerializerClass};

    ${pageScripts.NodeTracker};
    ${pageScripts.jsPath};
    ${pageScripts.Fetcher};
    ${pageScripts.MouseEvents};

    (function installDomRecorder(runtimeFunction) {
       ${pageScripts.pageEventsRecorder}
    })('${pageEventsCallbackName}');

    window.HERO = {
      JsPath,
      MouseEvents,
      Fetcher,
    };

    ${pageScripts.domStorage}
})();`;

const showInteractionScript = `(function installInteractionsScript() {
    const exports = {}; // workaround for ts adding an exports variable

    window.selfFrameIdPath = '';
    if (!'blockClickAndSubmit' in window) window.blockClickAndSubmit = false;

    if (!('getNodeById' in window)) {
      window.getNodeById = function getNodeById(id) {
        if (id === null || id === undefined) return null;
        return NodeTracker.getWatchedNodeWithId(id, false);
      };
    }

    ${pageScripts.interactReplayer};
})();`;

const detachedInjectedScript = `(function installInjectedScripts() {
    const exports = {}; // workaround for ts adding an exports variable
    ${stringifiedTypeSerializerClass};

    const TSON = TypeSerializer;

    ${pageScripts.NodeTracker};
    ${pageScripts.domReplayer};
    ${pageScripts.jsPath};
    ${pageScripts.Fetcher};

    window.HERO = {
      JsPath,
      Fetcher,
    };
})();`;

const installedSymbol = Symbol('InjectedScripts.Installed');

export default class InjectedScripts {
  public static JsPath = `HERO.JsPath`;
  public static Fetcher = `HERO.Fetcher`;
  public static PageEventsCallbackName = pageEventsCallbackName;

  public static install(puppetPage: IPuppetPage, showInteractions = false): Promise<any> {
    if (puppetPage[installedSymbol]) return;
    puppetPage[installedSymbol] = true;

    return Promise.all([
      puppetPage.addPageCallback(pageEventsCallbackName),
      puppetPage.addNewDocumentScript(injectedScript, true),
      puppetPage.addNewDocumentScript(`delete window.${pageEventsCallbackName}`, false),
      showInteractions ? puppetPage.addNewDocumentScript(showInteractionScript, true) : null,
    ]);
  }

  public static async installDetachedScripts(
    puppetPage: IPuppetPage,
    showInteractions = false,
  ): Promise<void> {
    if (puppetPage[installedSymbol]) return;
    puppetPage[installedSymbol] = true;

    await Promise.all([
      puppetPage.addNewDocumentScript(detachedInjectedScript, true),
      showInteractions ? puppetPage.addNewDocumentScript(showInteractionScript, true) : null,
      puppetPage.addNewDocumentScript(`window.blockClickAndSubmit = true;`, true),
    ]);
  }

  public static async restoreDom(
    puppetPage: IPuppetPage,
    changeEvents: IFrontendDomChangeEvent[],
  ): Promise<void> {
    await InjectedScripts.injectPaintEvents(puppetPage, [{ changeEvents } as any]);
    await InjectedScripts.setPaintIndexRange(puppetPage, 0, 0);
  }

  public static async setPaintIndexRange(
    puppetPage: IPuppetPage,
    startIndex: number,
    endIndex: number,
  ): Promise<void> {
    await puppetPage.mainFrame.evaluate(
      `window.setPaintIndexRange(${startIndex}, ${endIndex});`,
      true,
    );
  }

  public static async injectPaintEvents(
    puppetPage: IPuppetPage,
    paintEvents: IPaintEvent[],
    domNodePathByFrameId?: { [frameId: number]: string },
  ): Promise<void> {
    if (!puppetPage[installedSymbol]) {
      await this.installDetachedScripts(puppetPage);
    }

    const columns = [
      'action',
      'nodeId',
      'nodeType',
      'textContent',
      'tagName',
      'namespaceUri',
      'parentNodeId',
      'previousSiblingId',
      'attributeNamespaces',
      'attributes',
      'properties',
      'frameId',
    ] as const;

    const tagNames: { [tagName: string]: number } = {};
    const tagNamesById: { [tagId: number]: string } = {};
    let tagCounter = 0;

    const events: IFrontendDomChangeEvent[][] = [];
    for (const event of paintEvents) {
      const changes = [];
      events.push(changes);
      for (const change of event.changeEvents) {
        if (change.tagName && tagNames[change.tagName] === undefined) {
          tagCounter += 1;
          tagNamesById[tagCounter] = change.tagName;
          tagNames[change.tagName] = tagCounter;
        }
        const record = columns.map(col => {
          const prop = change[col];
          if (col === 'tagName') return tagNames[prop as string];
          return prop;
        });
        changes.push(record);
      }
    }

    await puppetPage.mainFrame.evaluate(
      `(function replayEvents(){
    const exports = {};
    window.isMainFrame = true;

    const records = ${JSON.stringify(events).replace(/,null/g, ',')};
    const tagNamesById = ${JSON.stringify(tagNamesById)};
    const domNodePathsByFrameId = ${JSON.stringify(domNodePathByFrameId ?? {})};
    window.records=  { records,tagNamesById, domNodePathsByFrameId};
    const paintEvents = [];
    for (const event of records) {
      const changeEvents = [];
      paintEvents.push(changeEvents);
      for (const [${columns.join(',')}] of event) {
        const event = { ${columns.join(',')} };
        event.frameIdPath = domNodePathsByFrameId[frameId];
        if (event.tagName !== undefined) event.tagName = tagNamesById[event.tagName];
        changeEvents.push(event);
      }
    }

    window.loadPaintEvents(paintEvents);
})()
//# sourceURL=${injectedSourceUrl}`,
      true,
    );
  }

  public static async replayInteractions(
    puppetPage: IPuppetPage,
    highlightNodeIds: IHighlightedNodes,
    mouse: IFrontendMouseEvent,
    scroll: IFrontendScrollEvent,
  ): Promise<void> {
    const args = [highlightNodeIds, mouse, scroll]
      .map(x => {
        if (!x) return 'undefined';
        return JSON.stringify(x);
      })
      .join(', ');
    await puppetPage.mainFrame.evaluate(`window.replayInteractions(${args});`, true);
  }

  public static async installDomStorageRestore(puppetPage: IPuppetPage): Promise<void> {
    await puppetPage.addNewDocumentScript(
      `(function restoreDomStorage() {
const exports = {}; // workaround for ts adding an exports variable
${stringifiedTypeSerializerClass};

${pageScripts.domStorage};
})();`,
      true,
    );
  }
}
