import Config from './Config';
export default class DomPolyfillJson {
    private readonly dataMap;
    constructor(config: Config, userAgentIds: string[]);
    save(dataDir: string): void;
    static clean(dataDir: string, userAgentIds: string[]): void;
    static hasAllDomPolyfills(browserId: string, dataDir: string, userAgentIds: string[]): boolean;
}
