import * as fs from 'fs';
import { IPuppetPage } from '@secret-agent/puppet-interfaces/IPuppetPage';
import TypeSerializer from '@secret-agent/commons/TypeSerializer';

const pageScripts = {
  domStorage: fs.readFileSync(require.resolve(`../injected-scripts/domStorage.js`), 'utf8'),
  jsPath: fs.readFileSync(require.resolve(`../injected-scripts/jsPath.js`), 'utf8'),
  Fetcher: fs.readFileSync(require.resolve(`../injected-scripts/Fetcher.js`), 'utf8'),
  MouseEvents: fs.readFileSync(require.resolve(`../injected-scripts/MouseEvents.js`), 'utf8'),
};

const injectedScript = `(function installInjectedScripts() {
const exports = {}; // workaround for ts adding an exports variable
${TypeSerializer.domScript};

${pageScripts.jsPath};
${pageScripts.Fetcher};
${pageScripts.MouseEvents};

window.SecretAgent = {
  JsPath,
  MouseEvents,
  Fetcher,
};

${pageScripts.domStorage}
})();`;

const installedSymbol = Symbol('InjectedScripts.Installed');

export default class InjectedScripts {
  public static JsPath = `window.SecretAgent.JsPath`;
  public static Fetcher = `window.SecretAgent.Fetcher`;

  public static async install(puppetPage: IPuppetPage): Promise<void> {
    if (puppetPage[installedSymbol]) return;
    puppetPage[installedSymbol] = true;
    await puppetPage.addNewDocumentScript(injectedScript, true);
  }
}
