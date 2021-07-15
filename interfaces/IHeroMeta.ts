import ISessionCreateOptions from './ISessionCreateOptions';

export default interface IHeroMeta
  extends Omit<Required<ISessionCreateOptions>, 'userProfile' | 'scriptInstanceMeta'> {
  userAgentString: string;
  operatingSystemPlatform: string;
  sessionId: string;
}
