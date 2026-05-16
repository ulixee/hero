import IBrowserEngineOption from '@ulixee/unblocked-specification/agent/browser/IBrowserEngineOption';
export default class ConfigJson {
    readonly browserId: string;
    readonly browserEngineId: string;
    readonly browserEngineOption: IBrowserEngineOption;
    private readonly data;
    constructor(browserId: string, browserEngineId: string, browserEngineOption: IBrowserEngineOption);
    save(baseDir: string): void;
}
