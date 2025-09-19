import ITlsClienthelloProfile from '@double-agent/collect-tls-clienthello/interfaces/IProfile';
export declare const extensionTypes: Set<string>;
export declare const usedExtensionTypes: Set<string>;
export default class CheckGenerator {
    readonly checks: any[];
    private readonly userAgentId;
    private readonly clientHello;
    private hasGrease;
    constructor(profile: ITlsClienthelloProfile);
    private createVersionCheck;
    private createCipherChecks;
    private createExtensionChecks;
    private createCurveChecks;
    private createPointFormatChecks;
    private createSupportedVersionChecks;
    private createSignatureAlgos;
    private createAlpnChecks;
    private createGreaseCheck;
    private isGreased;
}
