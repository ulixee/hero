import { IUnblockedPluginClass } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import type ISessionRegistry from '@ulixee/hero-core/interfaces/ISessionRegistry';

export default interface ICoreConfigureOptions {
  maxConcurrentClientCount?: number;
  dataDir?: string;
  defaultUnblockedPlugins?: IUnblockedPluginClass[];
  shouldShutdownOnSignals?: boolean;
  sessionRegistry?: ISessionRegistry;
}
