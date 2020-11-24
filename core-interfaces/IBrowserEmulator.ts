import INetworkInterceptorDelegate from './INetworkInterceptorDelegate';
import IUserProfile from './IUserProfile';
import INewDocumentInjectedScript from './INewDocumentInjectedScript';

export default interface IBrowserEmulator {
  readonly navigatorUserAgent: string;
  readonly navigatorPlatform: string;
  readonly canPolyfill: boolean;
  readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  locale: string;
  userProfile: IUserProfile;

  newDocumentInjectedScripts(): Promise<INewDocumentInjectedScript[]>;
}
