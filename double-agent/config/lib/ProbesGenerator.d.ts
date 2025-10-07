export default class ProbesGenerator {
    private profilePathsMap;
    private totalChecks;
    private layers;
    private plugins;
    constructor(profilesDir: string, userAgentIdsToUse?: string[]);
    clearBuckets(): Promise<void>;
    run(): void;
    save(): void;
    private getProfiles;
}
