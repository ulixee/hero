import IFingerprintProfile from '@double-agent/collect-browser-fingerprints/interfaces/IProfile';
export default class CheckGenerator {
    readonly checks: any[];
    private readonly profile;
    constructor(profile: IFingerprintProfile);
    private extractChecks;
}
