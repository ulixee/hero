import { IVersion } from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import UserAgent from '@ulixee/real-user-agents/lib/UserAgent';

const compareVersions = require('compare-versions');

export default class UserAgentSelector {
  private readonly selectors: ISelector[];

  constructor(readonly userAgentSelector: string) {
    this.selectors = this.extractUserAgentSelectors();
    this.isMatch = this.isMatch.bind(this);
  }

  isMatch(userAgent: UserAgent): boolean {
    if (!this.selectors.length) return true;

    for (const { name, matches } of this.selectors) {
      let version: string;
      if (name === userAgent.browserName) {
        version = userAgent.browserBaseVersion.filter(x => x !== null && x !== undefined).join('.');
      } else if (name === userAgent.operatingSystemName) {
        version = this.convertToSemVer(userAgent.operatingSystemVersion);
      } else {
        return false;
      }
      for (const match of matches) {
        if (match.version === '*.*.*') continue;
        const isValid = compareVersions.compare(version, match.version, match.operator);

        // must match every selector
        if (!isValid) return false;
      }
    }
    return true;
  }

  private extractUserAgentSelectors(): ISelector[] {
    const selectorByName: { [name: string]: ISelector } = {};
    const parts = this.userAgentSelector
      .substr(1)
      .toLowerCase()
      .split('&')
      .map(x => x.trim());
    for (const part of parts) {
      const matches = part.match(/^([a-z\s-]+)([\s><=]+)?([0-9.x*]+)?/);
      if (!matches?.length) continue;
      const [rawName, rawOperator, rawVersion] = matches.slice(1);
      const name = this.cleanupName(rawName);
      const operator = this.cleanupOperator(rawOperator);
      let version = this.cleanupVersion(rawVersion);
      selectorByName[name] = selectorByName[name] || { name, matches: [] };

      if (operator === '=') {
        const versionParts = version.split('.');
        const missingParts = 3 - versionParts.length;
        for (let i = 0; i < missingParts; i += 1) {
          versionParts.push('*');
        }
        version = versionParts.join('.');
      }
      if (version) selectorByName[name].matches.push({ operator, version });
    }

    return Object.values(selectorByName);
  }

  private convertToSemVer(version: IVersion): string {
    return [version.major, version.minor, version.patch]
      .filter(x => x !== undefined && x !== null)
      .join('.');
  }

  private cleanupName(name: string): string {
    name = name.trim();
    if (name.startsWith('chrome')) return 'Chrome';
    if (name.startsWith('firefox')) return 'Firefox';
    if (name.startsWith('safari')) return 'Safari';
    if (name.startsWith('mac')) return 'Mac OS';
    if (name.startsWith('win')) return 'Windows';
    if (name.startsWith('linux')) return 'Linux';
    return name.split(' ')[0];
  }

  private cleanupOperator(operator: string): string {
    if (!operator) return '=';
    return operator.replace(/[^<>=]+/g, '');
  }

  private cleanupVersion(version: string): string {
    if (!version) return '*';
    return version.trim().replace(/[^0-9x*]+/g, '.');
  }
}
interface ISelectorMatch {
  operator: string;
  version: string;
}

interface ISelector {
  name: string;
  matches: ISelectorMatch[];
}
