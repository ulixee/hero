import IProfile from '@double-agent/collect-http2-session/interfaces/IProfile';
export default class CheckGenerator {
    readonly checks: any[];
    private readonly profile;
    private readonly userAgentId;
    constructor(profile: IProfile);
}
