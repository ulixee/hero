import IBrowserEmulatorClass, {
  BrowserEmulatorClassDecorator,
} from '@secret-agent/core-interfaces/IBrowserEmulatorClass';
import IBrowserEmulator from '@secret-agent/core-interfaces/IBrowserEmulator';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import { EngineFetcher } from '@secret-agent/puppet/lib/EngineFetcher';
import Log from '@secret-agent/commons/Logger';
import modifyHeaders from './lib/modifyHeaders';
import DataLoader from './lib/DataLoader';
import DomDiffLoader from './lib/DomDiffLoader';
import getTcpSettingsForOs from './lib/getTcpSettingsForOs';
import parseNavigatorPlugins from './lib/parseNavigatorPlugins';
import DomOverridesBuilder from './lib/DomOverridesBuilder';
import * as DnsOverTlsProviders from './lib/DnsOverTlsProviders';

const { log } = Log(module);

function getEngine(
  engine: { browser: string; version: string },
  executablePathEnvVar?: string,
): IBrowserEngine {
  const engineFetcher = new EngineFetcher(
    engine.browser,
    engine.version,
    executablePathEnvVar,
  ).toJSON();

  log.stats('Browser.getEngine', {
    sessionId: null,
    engineFetcher,
  });

  return engineFetcher;
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
  getEngine,
  parseNavigatorPlugins,
};
