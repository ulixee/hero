import * as browserPaths from '@secret-agent/puppet/lib/browserPaths';
import chromePageOverrides from './lib/chromePageOverrides';
import modifyHeaders from './lib/modifyHeaders';
import readPolyfills from './lib/readPolyfills';
import tcpVars from './lib/tcpVars';
import parseNavigatorPlugins from './lib/parseNavigatorPlugins';

function getEngineExecutablePath(engine: { browser: string; revision: string }) {
  return browserPaths.getExecutablePath(engine.browser, engine.revision);
}

export {
  chromePageOverrides,
  modifyHeaders,
  readPolyfills,
  tcpVars,
  getEngineExecutablePath,
  parseNavigatorPlugins,
};
