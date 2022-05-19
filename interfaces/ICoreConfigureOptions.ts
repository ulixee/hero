import { IUnblockedPluginClass } from '@unblocked-web/specifications/plugin/IUnblockedPlugin';

export default interface ICoreConfigureOptions {
  maxConcurrentClientCount?: number;
  dataDir?: string;
  defaultUnblockedPlugins?: IUnblockedPluginClass[];
}
