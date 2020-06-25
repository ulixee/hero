import IUserAgent from '../interfaces/IUserAgent';
import IHttpRequestModifierDelegate from '@secret-agent/commons/interfaces/IHttpRequestModifierDelegate';
import { pickRandom } from './Utils';
import IPageOverride from '../interfaces/IPageOverride';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';

export default abstract class EmulatorPlugin {
  public static emulatorId: string;

  public abstract delegate: IHttpRequestModifierDelegate;

  protected constructor(public userAgent: IUserAgent) {
    if (!this.userAgent) {
      throw new Error('EmulatorPlugin must have a userAgent');
    }
  }

  public abstract async generatePageOverrides(): Promise<IPageOverride[]>;

  public setUserProfile(userProfile: IUserProfile) {
    // no-op by default
  }

  protected static pickRandomUseragent(
    agents: IUserAgent[],
    filterByOperatingSystem?: { family: string; major: string; minor?: string },
  ) {
    if (!filterByOperatingSystem) return pickRandom(agents);

    return pickRandom(
      agents.filter(
        x =>
          x.os.family === filterByOperatingSystem.family &&
          x.os.major === filterByOperatingSystem.major &&
          (filterByOperatingSystem.minor ? filterByOperatingSystem.minor === x.os.minor : true),
      ),
    );
  }
}
