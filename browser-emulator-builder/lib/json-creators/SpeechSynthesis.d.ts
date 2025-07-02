import Config from './Config';
export default class SpeechSynthesisJson {
    private readonly browserId;
    private readonly dataByOsId;
    private readonly osDefaults;
    constructor(config: Config, userAgentIds: string[]);
    save(dataDir: string): void;
}
