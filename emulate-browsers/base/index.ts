import IBrowserEmulatorClass, {
  BrowserEmulatorClassDecorator,
} from '@secret-agent/core-interfaces/IBrowserEmulatorClass';
import IBrowserEmulator from '@secret-agent/core-interfaces/IBrowserEmulator';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import { EngineFetcher } from '@secret-agent/puppet/lib/EngineFetcher';
import Log from '@secret-agent/commons/Logger';
import modifyHeaders from './lib/modifyHeaders';
import DataLoader from './lib/DataLoader';
import DomPolyfillLoader from './lib/DomPolyfillLoader';
import getTcpSettingsForOs from './lib/getTcpSettingsForOs';
import parseNavigatorPlugins from './lib/parseNavigatorPlugins';
import DomOverridesBuilder from './lib/DomOverridesBuilder';
import * as DnsOverTlsProviders from './lib/DnsOverTlsProviders';
import Viewports from './lib/Viewports';

const { log } = Log(module);

function getEngine(
  engine: { name: string; fullVersion: string },
  executablePathEnvVar?: string,
  getLaunchArguments?: IBrowserEngine['getLaunchArguments'],
): IBrowserEngine {
  const engineFetcher = new EngineFetcher(engine.name, engine.fullVersion, executablePathEnvVar);

  const browserEngine = engineFetcher.toJSON();
  log.stats('Browser.getEngine', {
    sessionId: null,
    browserEngine,
  });
  const engineFetcherLaunchArgs = engineFetcher.launchArgs;
  browserEngine.getLaunchArguments = (puppetOptions, defaultArguments) => {
    defaultArguments.push(...engineFetcherLaunchArgs);
    if (getLaunchArguments) return getLaunchArguments(puppetOptions, defaultArguments);
    return defaultArguments;
  };

  return browserEngine;
}

export {
  DnsOverTlsProviders,
  BrowserEmulatorClassDecorator,
  IBrowserEmulator,
  IBrowserEmulatorClass,
  DomOverridesBuilder,
  modifyHeaders,
  DataLoader,
  DomPolyfillLoader,
  getTcpSettingsForOs,
  Viewports,
  getEngine,
  parseNavigatorPlugins,
};
