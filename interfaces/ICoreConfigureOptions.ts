import { IAgentPluginClass } from '@unblocked-web/specifications/plugin/IAgentPlugin';

export default interface ICoreConfigureOptions {
  maxConcurrentClientCount?: number;
  dataDir?: string;
  defaultAgentPlugins?: IAgentPluginClass[];
}
