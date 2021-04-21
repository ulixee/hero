import ICoreConfigureOptions from '@secret-agent/interfaces/ICoreConfigureOptions';

export default interface IConnectionToCoreOptions
  extends Omit<ICoreConfigureOptions, 'maxConcurrentAgentsCount'> {
  host?: string | Promise<string>;
  maxConcurrency?: number;
  agentTimeoutMillis?: number;
  isPersistent?: boolean; // variable to tell server to keep around connection. Defaults to true
}
