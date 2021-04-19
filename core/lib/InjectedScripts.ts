import * as fs from 'fs';
import { IPuppetPage } from '@secret-agent/puppet-interfaces/IPuppetPage';
import { stringifiedTypeSerializerClass } from '@secret-agent/commons/TypeSerializer';
import { PageRecorderResultSet } from '../injected-scripts/pageEventsRecorder';

const pageScripts = {
  domStorage: fs.readFileSync(`${__dirname}/../injected-scripts/domStorage.js`, 'utf8'),
  jsPath: fs.readFileSync(`${__dirname}/../injected-scripts/jsPath.js`, 'utf8'),
  Fetcher: fs.readFileSync(`${__dirname}/../injected-scripts/Fetcher.js`, 'utf8'),
  MouseEvents: fs.readFileSync(`${__dirname}/../injected-scripts/MouseEvents.js`, 'utf8'),
  domObserver: fs.readFileSync(`${__dirname}/../injected-scripts/pageEventsRecorder.js`, 'utf8'),
};

const pageEventsCallbackName = '__saPageListenerCallback';

const injectedScript = `(function installInjectedScripts() {
const exports = {}; // workaround for ts adding an exports variable
${stringifiedTypeSerializerClass};

const TSON = TypeSerializer;

${pageScripts.jsPath};
${pageScripts.Fetcher};
${pageScripts.MouseEvents};

(function installDomRecorder(runtimeFunction) {
   ${pageScripts.domObserver}
})('${pageEventsCallbackName}');

window.SA = {
  JsPath,
  MouseEvents,
  Fetcher,
};

${pageScripts.domStorage}
})();`;

const installedSymbol = Symbol('InjectedScripts.Installed');

export default class InjectedScripts {
  public static JsPath = `SA.JsPath`;
  public static Fetcher = `SA.Fetcher`;

  public static async install(
    puppetPage: IPuppetPage,
    onPageRecordingsPublished: (results: PageRecorderResultSet, frameId: string) => Promise<any>,
  ): Promise<void> {
    if (puppetPage[installedSymbol]) return;
    puppetPage[installedSymbol] = true;

    if (onPageRecordingsPublished) {
      await puppetPage.addPageCallback(pageEventsCallbackName, (payload, frameId) =>
        onPageRecordingsPublished(JSON.parse(payload), frameId),
      );
    }

    await puppetPage.addNewDocumentScript(injectedScript, true);
    // delete binding from every context also
    await puppetPage.addNewDocumentScript(`delete window.${pageEventsCallbackName}`, false);
  }

  public static async installDomStorageRestore(puppetPage: IPuppetPage): Promise<void> {
    await puppetPage.addNewDocumentScript(
      `(function restoreDomStorage() {
const exports = {}; // workaround for ts adding an exports variable
${stringifiedTypeSerializerClass};

const TSON = TypeSerializer;

${pageScripts.domStorage};
})();`,
      true,
    );
  }
}
