import {
  IBrowserEmulator,
  IBrowserEmulatorClass,
  BrowserEmulatorClassDecorator,
} from '@secret-agent/interfaces/IPluginBrowserEmulator';
import BrowserEmulatorBase from './lib/BrowserEmulatorBase';
import * as DnsOverTlsProviders from './lib/DnsOverTlsProviders';

export {
  DnsOverTlsProviders,
  BrowserEmulatorClassDecorator,
  BrowserEmulatorBase,
  IBrowserEmulator,
  IBrowserEmulatorClass,
};
