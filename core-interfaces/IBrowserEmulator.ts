import INetworkInterceptorDelegate from './INetworkInterceptorDelegate';
import IUserProfile from './IUserProfile';
import IUserAgent from './IUserAgent';
import IPageOverride from './IPageOverride';

export default interface IBrowserEmulator {
  readonly userAgent: IUserAgent;
  readonly canPolyfill: boolean;
  readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  locale: string;
  userProfile: IUserProfile;

  generatePageOverrides(): Promise<IPageOverride[]>;
}
