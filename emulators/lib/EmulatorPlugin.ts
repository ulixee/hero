import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import IUserAgent from '../interfaces/IUserAgent';
import IPageOverride from '../interfaces/IPageOverride';

export default abstract class EmulatorPlugin {
  public static emulatorId: string;
  public readonly userAgent: IUserAgent;
  public abstract canPolyfill: boolean;
  public abstract engineExecutablePath: string;
  public abstract engine: { browser: string; revision: string };
  public abstract delegate: IHttpRequestModifierDelegate;
  public locale = 'en-US,en';
  protected userProfile: IUserProfile;

  public abstract async generatePageOverrides(): Promise<IPageOverride[]>;

  public setUserProfile(userProfile: IUserProfile) {
    this.userProfile = userProfile;
  }

  public setLocale(locale: string) {
    this.locale = locale;
  }
}
