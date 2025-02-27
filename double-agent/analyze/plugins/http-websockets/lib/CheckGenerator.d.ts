import IProfile from '@double-agent/collect-http-websockets/interfaces/IProfile';
export default class CheckGenerator {
    readonly checks: any[];
    private readonly profile;
    private readonly userAgentId;
    constructor(profile: IProfile);
}
