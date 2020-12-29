import INetworkInterceptorDelegate from './INetworkInterceptorDelegate';
import IUserProfile from './IUserProfile';
import INewDocumentInjectedScript from './INewDocumentInjectedScript';
import IWindowFraming from "./IWindowFraming";

export default interface IBrowserEmulator {
  readonly userAgentString: string;
  readonly osPlatform: string;
  readonly canPolyfill: boolean;
  readonly networkInterceptorDelegate: INetworkInterceptorDelegate;
  readonly windowFramingBase?: IWindowFraming;
  readonly windowFraming?: IWindowFraming;
  locale: string;
  userProfile: IUserProfile;

  newDocumentInjectedScripts(): Promise<INewDocumentInjectedScript[]>;
}
