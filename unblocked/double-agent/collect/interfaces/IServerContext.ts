import SessionTracker from '../lib/SessionTracker';
import PluginDelegate from '../lib/PluginDelegate';
import Plugin from '../lib/Plugin';

export default interface IServerContext {
  readonly sessionTracker: SessionTracker;
  readonly pluginDelegate: PluginDelegate;
  readonly plugin: Plugin;
}
