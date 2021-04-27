import IBrowserEmulatorClass, {
  BrowserEmulatorClassDecorator,
} from '@secret-agent/interfaces/IBrowserEmulatorClass';
import IBrowserEmulator from '@secret-agent/interfaces/IBrowserEmulator';
import modifyHeaders from './lib/modifyHeaders';
import DataLoader from './lib/DataLoader';
import DomPolyfillLoader from './lib/DomPolyfillLoader';
import getTcpSettingsForOs from './lib/getTcpSettingsForOs';
import parseNavigatorPlugins from './lib/parseNavigatorPlugins';
import DomOverridesBuilder from './lib/DomOverridesBuilder';
import * as DnsOverTlsProviders from './lib/DnsOverTlsProviders';
import Viewports from './lib/Viewports';

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
  parseNavigatorPlugins,
};
