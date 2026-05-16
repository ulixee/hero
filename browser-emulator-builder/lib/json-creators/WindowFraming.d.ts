import Config from './Config';
export default class WindowFraming {
    private readonly data;
    private readonly dataByOsId;
    private readonly browserId;
    constructor(config: Config, userAgentIds: string[]);
    save(dataDir: string): void;
}
