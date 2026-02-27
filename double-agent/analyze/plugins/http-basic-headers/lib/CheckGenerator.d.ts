import IHttpBasicHeadersProfile from '@double-agent/collect-http-basic-headers/interfaces/IProfile';
export default class CheckGenerator {
    readonly checks: any[];
    private readonly profile;
    private readonly userAgentId;
    constructor(profile: IHttpBasicHeadersProfile);
}
