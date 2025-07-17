import IHttpBasicCookiesProfile from '@double-agent/collect-http-basic-cookies/interfaces/IProfile';
export default class CheckGenerator {
    readonly checks: any[];
    private readonly profile;
    constructor(profile: IHttpBasicCookiesProfile);
    private extractChecks;
    private extractSetCookieDetails;
    private addCheck;
}
