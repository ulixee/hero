import Plugin from '@double-agent/collect/lib/Plugin';
export default class BrowserFingerprintPlugin extends Plugin {
    initialize(): void;
    private loadFingerprint;
    private fingerprintJs;
    private save;
}
