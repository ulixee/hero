import ICreateSessionOptions from './ICreateSessionOptions';

export default interface IAgentMeta
  extends Omit<Required<ICreateSessionOptions>, 'userProfile' | 'scriptInstanceMeta'> {
  userAgentString: string;
  osPlatform: string;
  sessionId: string;
}
