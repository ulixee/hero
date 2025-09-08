import Plugin from '@double-agent/collect/lib/Plugin';
export default class HttpUaHintsPlugin extends Plugin {
    static uaHintOptions: string[];
    initialize(): void;
    private loadCss;
    private loadImage;
    private saveAndLoadScript;
    private savePreflightHeaders;
    private loadScript;
    private save;
}
