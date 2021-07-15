import ISessionCreateOptions from './ISessionCreateOptions';

export default interface IAgentMeta
  extends Omit<Required<ISessionCreateOptions>, 'userProfile' | 'scriptInstanceMeta'> {
  userAgentString: string;
  operatingSystemPlatform: string;
  sessionId: string;
}
