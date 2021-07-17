import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';

export default interface IConnectionToCoreOptions
  extends Omit<ICoreConfigureOptions, 'maxConcurrentHeroesCount'> {
  host?: string | Promise<string>;
  maxConcurrency?: number;
  heroTimeoutMillis?: number;
  isPersistent?: boolean; // variable to tell server to keep around connection. Defaults to true
}
