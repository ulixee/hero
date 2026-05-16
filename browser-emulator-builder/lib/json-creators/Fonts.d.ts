import Config from './Config';
export default class FontsJson {
    private readonly browserId;
    private readonly dataByOsId;
    constructor(config: Config, userAgentIds: string[]);
    save(dataDir: string): void;
}
