import IUserAgent from '../interfaces/IUserAgent';
import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import IPageOverride from '../interfaces/IPageOverride';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';

export default abstract class EmulatorPlugin {
  public static emulatorId: string;
  public readonly userAgent: IUserAgent;
  public abstract canPolyfill: boolean;
  public abstract engineExecutablePath: string;
  public abstract delegate: IHttpRequestModifierDelegate;
  protected userProfile: IUserProfile;

  public abstract async generatePageOverrides(): Promise<IPageOverride[]>;

  public setUserProfile(userProfile: IUserProfile) {
    this.userProfile = userProfile;
  }
}
