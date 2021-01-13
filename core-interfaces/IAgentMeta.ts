import ICreateSessionOptions from './ICreateSessionOptions';

export default interface IAgentMeta
  extends Omit<Required<ICreateSessionOptions>, 'userProfile' | 'scriptInstanceMeta'> {
  userAgentString: string;
  sessionId: string;
}
