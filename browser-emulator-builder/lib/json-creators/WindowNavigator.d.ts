import Config from './Config';
export default class WindowNavigatorJson {
    private readonly dataByOsId;
    private readonly browserId;
    constructor(config: Config, userAgentIds: string[]);
    save(dataDir: string): void;
}
