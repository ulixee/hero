import ITcpProfile from '@double-agent/collect/plugins/tcp/interfaces/IProfile';
export default class CheckGenerator {
    readonly ttlChecks: any[];
    readonly winChecks: any[];
    private readonly profile;
    constructor(profile: ITcpProfile);
    private extractTtlChecks;
    private extractWindowSizeChecks;
}
