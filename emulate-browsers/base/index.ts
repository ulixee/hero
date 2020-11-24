import * as browserPaths from '@secret-agent/puppet/lib/browserPaths';
import IBrowserEmulatorClass, {
  BrowserEmulatorClassDecorator,
} from '@secret-agent/core-interfaces/IBrowserEmulatorClass';
import IBrowserEmulator from '@secret-agent/core-interfaces/IBrowserEmulator';
import modifyHeaders from './lib/modifyHeaders';
import DataLoader from './lib/DataLoader';
import DomDiffLoader from './lib/DomDiffLoader';
import getTcpSettingsForOs from './lib/getTcpSettingsForOs';
import parseNavigatorPlugins from './lib/parseNavigatorPlugins';
import DomOverridesBuilder from './lib/DomOverridesBuilder';
import * as DnsOverTlsProviders from './lib/DnsOverTlsProviders';

function getEngineExecutablePath(engine: { browser: string; revision: string }) {
  return browserPaths.getExecutablePath(engine.browser, engine.revision);
}

export {
  DnsOverTlsProviders,
  BrowserEmulatorClassDecorator,
  IBrowserEmulator,
  IBrowserEmulatorClass,
  DomOverridesBuilder,
  modifyHeaders,
  DataLoader,
  DomDiffLoader,
  getTcpSettingsForOs,
  getEngineExecutablePath,
  parseNavigatorPlugins,
};
