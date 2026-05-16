import { IUserAgentMeta } from '@ulixee/real-user-agents';
import Plugin from '@double-agent/collect/lib/Plugin';
export default class BrowserProfiler {
    static get dataDir(): string;
    static get profilesDir(): string;
    static get profiledDoms(): string;
    static get userAgentIds(): string[];
    static userAgentDir(userAgentId: string): string;
    static init(): void;
    static loadDataFile<T>(relativePath: string): T;
    static extractMetaFromUserAgentId(userAgentId: string): IUserAgentMeta;
    static getProfile<TProfile = any>(pluginId: string, userAgentId: string): TProfile;
    static getProfiles<TProfile = any>(pluginId: string): TProfile[];
    static cleanPluginProfiles(pluginIds: string[]): void;
    static findMissingPlugins(userAgentId: string, plugins: Plugin[]): string[];
    static isMissingPlugins(userAgentId: string, plugins: Plugin[], rerunPluginIds: string[]): boolean;
}
