import * as browserPaths from '@secret-agent/puppet/lib/browserPaths';
import IBrowserEmulatorClass, {
  BrowserEmulatorClassDecorator,
} from '@secret-agent/core-interfaces/IBrowserEmulatorClass';
import IUserAgent from '@secret-agent/core-interfaces/IUserAgent';
import IBrowserEmulator from '@secret-agent/core-interfaces/IBrowserEmulator';
import chromePageOverrides from './lib/chromePageOverrides';
import modifyHeaders from './lib/modifyHeaders';
import readPolyfills from './lib/readPolyfills';
import getTcpSettingsForOs from './lib/getTcpSettingsForOs';
import parseNavigatorPlugins from './lib/parseNavigatorPlugins';
import StatcounterBrowserUsage from './lib/StatcounterBrowserUsage';
import UserAgents from './lib/UserAgents';
import * as DnsOverTlsProviders from './lib/DnsOverTlsProviders';

function getEngineExecutablePath(engine: { browser: string; revision: string }) {
  return browserPaths.getExecutablePath(engine.browser, engine.revision);
}

export {
  DnsOverTlsProviders,
  BrowserEmulatorClassDecorator,
  IUserAgent,
  IBrowserEmulator,
  IBrowserEmulatorClass,
  StatcounterBrowserUsage,
  UserAgents,
  chromePageOverrides,
  modifyHeaders,
  readPolyfills,
  getTcpSettingsForOs,
  getEngineExecutablePath,
  parseNavigatorPlugins,
};
