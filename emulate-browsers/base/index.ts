import * as browserPaths from '@secret-agent/puppet/lib/browserPaths';
import IBrowserEmulatorClass, {
  BrowserEmulatorClassDecorator,
} from '@secret-agent/core-interfaces/IBrowserEmulatorClass';
import IUserAgent from '@secret-agent/core-interfaces/IUserAgent';
import IBrowserEmulator from '@secret-agent/core-interfaces/IBrowserEmulator';
import chromePageOverrides from './lib/chromePageOverrides';
import modifyHeaders from './lib/modifyHeaders';
import readPolyfills from './lib/readPolyfills';
import tcpVars from './lib/tcpVars';
import parseNavigatorPlugins from './lib/parseNavigatorPlugins';
import BrowserDistribution from './lib/BrowserDistribution';
import UserAgents from './lib/UserAgents';

function getEngineExecutablePath(engine: { browser: string; revision: string }) {
  return browserPaths.getExecutablePath(engine.browser, engine.revision);
}

export {
  BrowserEmulatorClassDecorator,
  IUserAgent,
  IBrowserEmulator,
  IBrowserEmulatorClass,
  BrowserDistribution,
  UserAgents,
  chromePageOverrides,
  modifyHeaders,
  readPolyfills,
  tcpVars,
  getEngineExecutablePath,
  parseNavigatorPlugins,
};
