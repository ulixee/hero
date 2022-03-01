import ISessionCreateOptions from './ISessionCreateOptions';

export default interface IHeroMeta
  extends Omit<ISessionCreateOptions, 'userProfile' | 'scriptInstanceMeta'> {
  userAgentString: string;
  operatingSystemPlatform: string;
  operatingSystemVersion: string;
  browserFullVersion: string;
  sessionId: string;
}
