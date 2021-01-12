import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';

export default interface ICoreConnectionOptions
  extends Omit<ICoreConfigureOptions, 'maxConcurrentAgentsCount'> {
  host?: string | Promise<string>;
  maxConcurrency?: number;
  agentTimeoutMillis?: number;
  isPersistent?: boolean; // variable to tell server to keep around connection. Defaults to true
}
