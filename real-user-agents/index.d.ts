import UserAgent from './lib/UserAgent';
import OperatingSystem from './lib/OperatingSystem';
import Browser from './lib/Browser';
export default class RealUserAgents {
    static all(filterMinimumWebdrivable?: boolean): UserAgent[];
    static getId(userAgentId: string): UserAgent;
    static where(query: {
        browserId?: string;
        operatingSystemId?: string;
    }): UserAgent[];
    static findById(userAgentId: string): UserAgent;
    static random(countToGet: number, filterFn?: (userAgent: UserAgent) => boolean): UserAgent[];
    static popular(marketshareNeeded: number, filterFn?: (userAgent: UserAgent) => boolean): UserAgent[];
    static getBrowser(browserId: string): Browser;
    static getOperatingSystem(operatingSystemid: string): OperatingSystem;
    static extractMetaFromUserAgentId(userAgentId: string): IUserAgentMeta;
}
export interface IUserAgentMeta {
    operatingSystemId: string;
    operatingSystemName: string;
    operatingSystemVersion: string;
    browserId: string;
    browserName: string;
    browserVersion: string;
}
