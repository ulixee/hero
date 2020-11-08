import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import IUserProfile from './IUserProfile';
import IUserAgent from './IUserAgent';
import IPageOverride from './IPageOverride';

export default interface IBrowserEmulator {
  readonly userAgent: IUserAgent;
  canPolyfill: boolean;
  engineExecutablePath: string;
  engine: { browser: string; revision: string };
  delegate: IHttpRequestModifierDelegate;
  locale: string;
  userProfile: IUserProfile;

  generatePageOverrides(): Promise<IPageOverride[]>;
}
