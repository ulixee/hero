import IUserAgent from '../interfaces/IUserAgent';
import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import IPageOverride from '../interfaces/IPageOverride';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';

export default abstract class EmulatorPlugin {
  public static emulatorId: string;
  public readonly userAgent: IUserAgent;

  public abstract delegate: IHttpRequestModifierDelegate;

  public abstract async generatePageOverrides(): Promise<IPageOverride[]>;

  public setUserProfile(userProfile: IUserProfile) {
    // no-op by default
  }
}
