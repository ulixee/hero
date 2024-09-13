import UserAgent from './lib/UserAgent';
import Browsers from './lib/Browsers';
import OperatingSystems from './lib/OperatingSystems';
import OperatingSystem from './lib/OperatingSystem';
import Browser from './lib/Browser';

export default class RealUserAgents {
  public static all(filterMinimumWebdrivable = true): UserAgent[] {
    return Object.values(UserAgent.all()).filter(userAgent => {
      if (!filterMinimumWebdrivable) return true;

      const [major] = userAgent.browserBaseVersion;
      const name = userAgent.browserName;
      if (name === 'Chrome' && major < 58) return false;
      if (name === 'Edge' && major < 58) return false;
      if (name === 'Firefox' && major < 58) return false;
      if (name === 'Opera' && major < 58) return false;
      if (name === 'Safari' && major < 10) return false;
      if (name === 'IE') return false;
      return true;
    });
  }

  public static getId(userAgentId: string): UserAgent {
    return UserAgent.all()[userAgentId];
  }

  public static where(query: { browserId?: string; operatingSystemId?: string }): UserAgent[] {
    let userAgents = this.all();
    if (query.browserId) {
      userAgents = userAgents.filter(x => x.browserId === query.browserId);
    }
    if (query.operatingSystemId) {
      userAgents = userAgents.filter(x => x.operatingSystemId === query.operatingSystemId);
    }
    return userAgents;
  }

  public static findById(userAgentId: string): UserAgent {
    if (!userAgentId) return;
    return UserAgent.all()[userAgentId];
  }

  public static random(
    countToGet: number,
    filterFn?: (userAgent: UserAgent) => boolean,
  ): UserAgent[] {
    const availableUserAgents = this.all();
    const userAgentCount = availableUserAgents.length;

    const selectedUserAgents: UserAgent[] = [];
    while (selectedUserAgents.length < countToGet && selectedUserAgents.length < userAgentCount) {
      if (!availableUserAgents.length) break;
      const selectedIndex = Math.floor(Math.random() * availableUserAgents.length);
      const userAgent = availableUserAgents.splice(selectedIndex, 1)[0];
      if (filterFn && !filterFn(userAgent)) continue;
      selectedUserAgents.push(userAgent);
    }

    return selectedUserAgents;
  }

  public static popular(
    marketshareNeeded: number,
    filterFn?: (userAgent: UserAgent) => boolean,
  ): UserAgent[] {
    const sortedUserAgents = this.all().sort((a, b) => b.marketshare - a.marketshare);
    const selectedUserAgents = [];
    let selectedMarketshare = 0;

    for (const userAgent of sortedUserAgents) {
      if (selectedMarketshare > marketshareNeeded) break;
      if (filterFn && !filterFn(userAgent)) continue;
      selectedMarketshare += userAgent.marketshare;
      selectedUserAgents.push(userAgent);
    }

    return selectedUserAgents;
  }

  public static getBrowser(browserId: string): Browser {
    return Browsers.byId(browserId);
  }

  public static getOperatingSystem(operatingSystemid: string): OperatingSystem {
    return OperatingSystems.byId(operatingSystemid);
  }

  public static extractMetaFromUserAgentId(userAgentId: string): IUserAgentMeta {
    const matches = userAgentId.match(/^(([a-z-]+)(-([0-9-]+))?)--(([a-z-]+)-([0-9-]+))$/);
    const operatingSystemId = matches[1];
    const operatingSystemName = matches[2];
    const operatingSystemVersion = matches[4] || '';
    const browserId = matches[5];
    const browserName = matches[6];
    const browserVersion = matches[7];
    return {
      operatingSystemId,
      operatingSystemName,
      operatingSystemVersion,
      browserId,
      browserName,
      browserVersion,
    };
  }
}

export interface IUserAgentMeta {
  operatingSystemId: string;
  operatingSystemName: string;
  operatingSystemVersion: string;
  browserId: string;
  browserName: string;
  browserVersion: string;
}
