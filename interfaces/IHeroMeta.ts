import ISessionCreateOptions from './ISessionCreateOptions';

export default interface IHeroMeta
  extends Omit<ISessionCreateOptions, 'userProfile' | 'scriptInstanceMeta'> {
  userAgentString: string;
  operatingSystemName: string;
  operatingSystemVersion: string;
  windowNavigatorPlatform: string;
  uaClientHintsPlatformVersion: string;
  browserName: string;
  browserFullVersion: string;
  renderingEngine: string;
  renderingEngineVersion: string;
  sessionId: string;
}
