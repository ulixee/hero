import Config from './Config';
export default class ClienthelloJson {
    private readonly browserId;
    private readonly dataByOsId;
    constructor(config: Config, userAgentIds: string[]);
    save(dataDir: string): void;
}
