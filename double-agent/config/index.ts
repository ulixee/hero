import * as Fs from 'fs';
import * as Path from 'path';
import { createOsIdFromUserAgentString } from '@ulixee/real-user-agents/lib/OsUtils';
import { createBrowserIdFromUserAgentString } from '@ulixee/real-user-agents/lib/BrowserUtils';
import RealUserAgents from '@ulixee/real-user-agents';
import { loadEnv, parseEnvInt } from '@ulixee/commons/lib/envUtils';
import * as Paths from './paths';
import * as browserstackIndicators from './data/path-patterns/browserstack-indicators.json';
import * as instanceVariations from './data/path-patterns/instance-variations.json';
import * as devtoolsIndicators from './data/path-patterns/devtools-indicators.json';
import * as locationVariations from './data/path-patterns/location-variations.json';
import * as windowVariations from './data/path-patterns/window-variations.json';
import { probesDataDir, rootDir } from './paths';

loadEnv(Path.resolve(__dirname, '..'));
const env = process.env;

/////// /////////////////////////////////////////////////////////////////////////////////////

export function createUserAgentIdFromString(userAgentString: string): string {
  const osKey = createOsIdFromUserAgentString(userAgentString);
  const browserKey = createBrowserIdFromUserAgentString(userAgentString);
  return createUserAgentIdFromIds(osKey, browserKey);
}

export function createUserAgentIdFromIds(osId: string, browserId: string): string {
  return `${osId}--${browserId}`;
}

interface IProbeIdsMap {
  [pluginId: string]: {
    [checkSignature: string]: string;
  };
}

let probeIdsMap: IProbeIdsMap;

/////// /////////////////////////////////////////////////////////////////////////////////////

export default class Config {
  static userAgentIds: string[] = [];
  static dataDir = Path.join(rootDir, 'data');

  // copied from browser-profiler
  static profilesDataDir = Path.resolve(Paths.rootDir, '../../..', 'browser-profile-data');

  static collect = {
    port: parseEnvInt(env.COLLECT_PORT),
    domains: {
      MainDomain: env.MAIN_DOMAIN,
      SubDomain: env.SUB_DOMAIN,
      TlsDomain: env.TLS_DOMAIN,
      CrossDomain: env.CROSS_DOMAIN,
    },
    shouldGenerateProfiles: parseEnvBool(env.GENERATE_PROFILES),
    pluginStartingPort: parseEnvInt(env.PLUGIN_STARTING_PORT),
    pluginMaxPort: parseEnvInt(env.PLUGIN_MAX_PORT) || 20000,

    // collect plugins
    tcpNetworkDevice: env.TCP_NETWORK_DEVICE,
    tcpDebug: parseEnvBool(env.TCP_DEBUG),
    tlsPrintRaw: parseEnvBool(env.TLS_PRINT_RAW),

    // path to letsencrypt certs
    enableLetsEncrypt: parseEnvBool(env.LETSENCRYPT),
  };

  static runner = {
    assignmentsHost: env.DA_COLLECT_CONTROLLER_HOST,
  };

  static readonly probesDataDir = probesDataDir;

  static get probeIdsMap(): IProbeIdsMap {
    if (!this.probesDataDir) {
      throw new Error('probesDataDir must be set');
    }
    if (!probeIdsMap) {
      probeIdsMap = {};
      const probeIdsDir = Path.join(this.probesDataDir, 'probe-ids');
      if (Fs.existsSync(probeIdsDir)) {
        for (const fileName of Fs.readdirSync(probeIdsDir)) {
          const matches = fileName.match(/^(.+)\.json$/);
          if (!matches) continue;
          const pluginId = matches[1];
          probeIdsMap[pluginId] = JSON.parse(Fs.readFileSync(`${probeIdsDir}/${fileName}`, 'utf8'));
        }
      }
    }
    return probeIdsMap;
  }

  static get browserNames(): string[] {
    const names = this.userAgentIds.map(
      userAgentId => RealUserAgents.extractMetaFromUserAgentId(userAgentId).browserName,
    );
    return Array.from(new Set(names));
  }

  static get osNames(): string[] {
    const names = this.userAgentIds.map(
      userAgentId => RealUserAgents.extractMetaFromUserAgentId(userAgentId).operatingSystemName,
    );
    return Array.from(new Set(names));
  }

  static findUserAgentIdsByName(name: string): string[] {
    return this.userAgentIds.filter(userAgentId => {
      const meta = RealUserAgents.extractMetaFromUserAgentId(userAgentId);
      return [meta.operatingSystemName, meta.browserName].includes(name);
    });
  }

  static getProfilerIndicators(): typeof browserstackIndicators {
    return browserstackIndicators;
  }

  static getDevtoolsIndicators(): typeof devtoolsIndicators {
    return devtoolsIndicators;
  }

  static isVariationPath(path: string): boolean {
    if (instanceVariations.changed.some(pattern => pathIsPatternMatch(path, pattern))) return true;
    if (instanceVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
      return true;
    if (locationVariations.changed.some(pattern => pathIsPatternMatch(path, pattern))) return true;
    if (locationVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
      return true;
    if (windowVariations.changed.some(pattern => pathIsPatternMatch(path, pattern))) return true;
    if (windowVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
      return true;
    return false;
  }

  static shouldIgnorePathValue(path: string): boolean {
    if (devtoolsIndicators.added.some(pattern => pathIsPatternMatch(path, pattern))) return true;
    if (devtoolsIndicators.extraAdded.some(pattern => pathIsPatternMatch(path, pattern)))
      return true;
    if (devtoolsIndicators.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
      return true;
    if (browserstackIndicators.changedOrder.some(pattern => pathIsPatternMatch(path, pattern)))
      return true;

    if (this.isVariationPath(path)) return true;
    return false;
  }
}

export function pathIsPatternMatch(path: string, pattern: string): boolean {
  if (pattern.charAt(0) === '*') {
    return path.includes(pattern.substr(1));
  }
  return path.startsWith(pattern);
}

function parseEnvBool(envvar: string): boolean {
  if (envvar === '1' || envvar?.toLowerCase() === 'true' || envvar?.toLowerCase() === 'yes')
    return true;
  return false;
}
