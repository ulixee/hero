import INetworkInterceptorDelegate from './INetworkInterceptorDelegate';
import IUserProfile from './IUserProfile';
import IUserAgent from './IUserAgent';
import INewDocumentInjectedScript from './INewDocumentInjectedScript';

export default interface IBrowserEmulator {
  readonly userAgent: IUserAgent;
  readonly canPolyfill: boolean;
  readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  locale: string;
  userProfile: IUserProfile;

  newDocumentInjectedScripts(): Promise<INewDocumentInjectedScript[]>;
}
