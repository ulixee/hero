import Config from './Config';
export default class WindowChromeJson {
    private readonly dataByOsId;
    private readonly browserId;
    constructor(config: Config, userAgentIds: string[]);
    save(dataDir: string): void;
}
