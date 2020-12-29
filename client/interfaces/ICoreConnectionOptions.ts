import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';

export default interface ICoreConnectionOptions
  extends Omit<ICoreConfigureOptions, 'maxConcurrentAgentsCount'> {
  host?: string;
  maxConcurrency?: number;
  agentTimeoutMillis?: number;
}
