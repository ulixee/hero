import Config from './Config';
export default class HeadersJson {
    private readonly browserId;
    private data;
    constructor(config: Config, userAgentIds: string[]);
    save(dataDir: string): void;
    private processResources;
}
