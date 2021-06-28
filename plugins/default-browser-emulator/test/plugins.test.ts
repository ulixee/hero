import * as Fs from 'fs';
import * as Path from 'path';
import { inspect } from 'util';
import * as Helpers from '@secret-agent/testing/helpers';
import Puppet from '@secret-agent/puppet';
import Log from '@secret-agent/commons/Logger';
import Plugins from '@secret-agent/core/lib/Plugins';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import BrowserEmulator from '../index';
import * as pluginsChrome from './plugins-Chrome.json';
import { getOverrideScript } from '../lib/DomOverridesBuilder';
import DomExtractor = require('./DomExtractor');

const { log } = Log(module);
const selectBrowserMeta = BrowserEmulator.selectBrowserMeta();

const navigatorJsonPath = Path.resolve(
  __dirname,
  '../data/as-chrome-88-0/as-mac-os-10-14/window-navigator.json',
);

const { navigator } = JSON.parse(Fs.readFileSync(navigatorJsonPath, 'utf8')) as any;

let puppet: Puppet;
beforeAll(async () => {
  puppet = new Puppet(selectBrowserMeta.browserEngine);
  Helpers.onClose(() => puppet.close(), true);
  await puppet.start();
});

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

const debug = process.env.DEBUG || false;

test('it should override plugins in a browser window', async () => {
  const httpServer = await Helpers.runHttpServer();
  const plugins = new Plugins({ selectBrowserMeta }, log as IBoundLog);
  const context = await puppet.newContext(plugins, log);
  Helpers.onClose(() => context.close());
  const page = await context.newPage();

  page.on('page-error', console.log);
  if (debug) {
    page.on('console', console.log);
  }
  await page.addNewDocumentScript(
    getOverrideScript('navigator.plugins', {
      mimeTypes: [
        {
          type: 'application/pdf',
          suffixes: 'pdf',
          description: '',
          __pluginName: 'Chrome PDF Viewer',
        },
        {
          type: 'application/x-google-chrome-pdf',
          suffixes: 'pdf',
          description: 'Portable Document Format',
          __pluginName: 'Chrome PDF Plugin',
        },
        {
          type: 'application/x-nacl',
          suffixes: '',
          description: 'Native Client Executable',
          __pluginName: 'Native Client',
        },
        {
          type: 'application/x-pnacl',
          suffixes: '',
          description: 'Portable Native Client Executable',
          __pluginName: 'Native Client',
        },
      ],
      plugins: [
        {
          name: 'Chrome PDF Plugin',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format',
        },
        {
          name: 'Chrome PDF Viewer',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          description: '',
        },
        {
          name: 'Native Client',
          filename: 'internal-nacl-plugin',
          description: '',
        },
      ],
    }).script,
    false,
  );
  await Promise.all([
    page.navigate(httpServer.url),
    page.mainFrame.waitOn('frame-lifecycle', ev => ev.name === 'DOMContentLoaded'),
  ]);

  const hasPlugins = await page.mainFrame.evaluate(
    `'plugins' in navigator && 'mimeTypes' in navigator`,
    false,
  );
  expect(hasPlugins).toBe(true);

  const pluginCount = await page.mainFrame.evaluate(`navigator.plugins.length`, false);
  expect(pluginCount).toBe(3);

  const plugin1Count = await page.mainFrame.evaluate(
    `(() => {
  let mimes = [];
  for(const mime of navigator.plugins[0]) {
    mimes.push(mime.type);
  }
  return mimes;
})()`,
    false,
  );
  expect(plugin1Count).toStrictEqual(['application/x-google-chrome-pdf']);

  const mimecount = await page.mainFrame.evaluate(`navigator.mimeTypes.length`, false);
  expect(mimecount).toBe(4);

  const structure = JSON.parse(
    (await page.mainFrame.evaluate(
      `new (${DomExtractor.toString()})('window').run(window, 'window',  ['Plugin', 'PluginArray', 'MimeType', 'MimeTypeArray','navigator'])`,
      false,
    )) as any,
  ).window;

  for (const proto of ['Plugin', 'PluginArray', 'MimeType', 'MimeTypeArray']) {
    if (debug) console.log(proto, inspect(structure[proto], false, null, true));
    expect(structure[proto]).toStrictEqual(pluginsChrome[proto]);
  }
  const navigatorStructure = structure.navigator;
  if (debug) console.log(inspect(navigatorStructure.mimeTypes, false, null, true));
  expect(navigatorStructure.mimeTypes).toStrictEqual(navigator.mimeTypes);

  if (debug) console.log(inspect(navigatorStructure.plugins, false, null, true));
  expect(navigatorStructure.plugins).toStrictEqual(navigator.plugins);
}, 60e3);
