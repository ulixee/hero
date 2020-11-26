import INetworkInterceptorDelegate from './INetworkInterceptorDelegate';
import IUserProfile from './IUserProfile';
import INewDocumentInjectedScript from './INewDocumentInjectedScript';
import IWindowFraming from "./IWindowFraming";

export default interface IBrowserEmulator {
  readonly navigatorUserAgent: string;
  readonly navigatorPlatform: string;
  readonly windowFramingBase: IWindowFraming;
  readonly windowFraming: IWindowFraming;
  readonly canPolyfill: boolean;
  readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  locale: string;
  userProfile: IUserProfile;

  newDocumentInjectedScripts(): Promise<INewDocumentInjectedScript[]>;
}
