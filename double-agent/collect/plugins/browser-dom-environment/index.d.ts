import Plugin from '@double-agent/collect/lib/Plugin';
export default class BrowserDomPlugin extends Plugin {
    outputFiles: number;
    private pendingByKey;
    initialize(): void;
    private loadScript;
    private loadServiceWorker;
    private loadDedicatedWorker;
    private loadSharedWorker;
    private loadIFrame;
    private loadIFrameSandbox;
    private loadIFrameCrossDomain;
    private save;
    private waitUntilFinished;
    private waitUntilFinishedJs;
    private addWaitIfNeeded;
    private getPendingKey;
}
