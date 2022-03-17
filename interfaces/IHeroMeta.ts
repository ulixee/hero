import ISessionCreateOptions from './ISessionCreateOptions';

export default interface IHeroMeta
  extends Omit<ISessionCreateOptions, 'userProfile' | 'scriptInstanceMeta'> {
  userAgentString: string;
  operatingSystemName: string;
  operatingSystemPlatform: string;
  operatingSystemVersion: string;
  browserName: string;
  browserFullVersion: string;
  renderingEngine: string;
  renderingEngineVersion: string;
  sessionId: string;
}
