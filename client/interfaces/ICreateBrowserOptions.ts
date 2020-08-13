import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';

export default interface ICreateBrowserOptions
  extends Partial<Omit<ICreateSessionOptions, 'scriptInstanceMeta'>> {
  name?: string;
  showReplay?: boolean;
}
