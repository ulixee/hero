import * as fs from 'fs';
import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import { stringifiedTypeSerializerClass } from '@secret-agent/commons/TypeSerializer';
import injectedSourceUrl from '@secret-agent/interfaces/injectedSourceUrl';
import { IFrontendDomChangeEvent } from '../models/DomChangesTable';

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
const pageEventsCallbackName = '__saPageListenerCallback';

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

    window.SA = {
      JsPath,
      MouseEvents,
      Fetcher,
    };

    ${pageScripts.domStorage}
})();`;

const detachedInjectedScript = `(function installInjectedScripts() {
    const exports = {}; // workaround for ts adding an exports variable
    ${stringifiedTypeSerializerClass};

    const TSON = TypeSerializer;

    ${pageScripts.NodeTracker};
    ${pageScripts.jsPath};
    ${pageScripts.Fetcher};

    window.SA = {
      JsPath,
      Fetcher,
    };
    })();`;

const replayDomAndInteractionScript = `
    if (typeof exports === 'undefined') {
        var exports = {}; // workaround for ts adding an exports variable
    }
    ${pageScripts.NodeTracker};
    ${pageScripts.domReplayer};

    ${pageScripts.interactReplayer};
`;

const installedSymbol = Symbol('InjectedScripts.Installed');
const replayInstalledSymbol = Symbol('InjectedScripts.replayInstalled');

export default class InjectedScripts {
  public static JsPath = `SA.JsPath`;
  public static Fetcher = `SA.Fetcher`;
  public static PageEventsCallbackName = pageEventsCallbackName;

  public static install(puppetPage: IPuppetPage): Promise<any> {
    if (puppetPage[installedSymbol]) return;
    puppetPage[installedSymbol] = true;

    return Promise.all([
      puppetPage.addPageCallback(pageEventsCallbackName),
      puppetPage.addNewDocumentScript(injectedScript, true),
      puppetPage.addNewDocumentScript(`delete window.${pageEventsCallbackName}`, false),
    ]);
  }

  public static getReplayScript(): string {
    return replayDomAndInteractionScript;
  }

  public static async installDetachedScripts(puppetPage: IPuppetPage): Promise<void> {
    if (puppetPage[installedSymbol]) return;
    puppetPage[installedSymbol] = true;

    await puppetPage.addNewDocumentScript(detachedInjectedScript, true);
  }

  public static async restoreDom(
    puppetPage: IPuppetPage,
    domChanges: IFrontendDomChangeEvent[],
  ): Promise<void> {
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
    ];
    const records = domChanges.map(x => columns.map(col => x[col]));
    if (!puppetPage[installedSymbol]) {
      await this.installDetachedScripts(puppetPage);
    }
    // NOTE: NodeTracker is installed by detachedScripts
    const domScript = puppetPage[replayInstalledSymbol] ? '' : pageScripts.domReplayer;
    puppetPage[replayInstalledSymbol] = true;
    await puppetPage.mainFrame.evaluate(
      `(function replayEvents(){
    const exports = {};
    window.isMainFrame = true;

    (() => {
        ${domScript};
    })();

    const records = ${JSON.stringify(records).replace(/,null/g, ',')};
    const events = [];
    for (const [${columns.join(',')}] of records) {
      const event = {${columns.join(',')}};
      events.push(event);
    }

    window.replayDomChanges(events);
})()
//# sourceURL=${injectedSourceUrl}`,
      true,
    );
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
