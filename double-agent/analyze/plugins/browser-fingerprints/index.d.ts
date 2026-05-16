import Plugin from '@double-agent/analyze/lib/Plugin';
import IFingerprintProfile from '@double-agent/collect-browser-fingerprints/interfaces/IProfile';
export default class BrowserFingerprints extends Plugin {
    initialize(profiles: IFingerprintProfile[]): void;
    runIndividual(profile: IFingerprintProfile): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
    runOverTime(profile: IFingerprintProfile, profileCountOverTime: number): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
