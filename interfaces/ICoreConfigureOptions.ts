import { IUnblockedPluginClass } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';

export default interface ICoreConfigureOptions {
  maxConcurrentClientCount?: number;
  dataDir?: string;
  defaultUnblockedPlugins?: IUnblockedPluginClass[];
}
