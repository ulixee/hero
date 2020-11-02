import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';

export default interface ICreateSecretAgentOptions
  extends Partial<Omit<ICreateSessionOptions, 'scriptInstanceMeta'>> {
  name?: string;
  showReplay?: boolean;
}
