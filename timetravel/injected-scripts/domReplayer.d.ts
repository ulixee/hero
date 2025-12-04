import { IFrontendDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
declare global {
    interface Window {
        loadPaintEvents(paintEvents: IFrontendDomChangeEvent[][]): any;
        applyDomChanges(changes: IFrontendDomChangeEvent[]): any;
        domReplayer: DomReplayer;
        setPaintIndex(index: number): any;
        repositionInteractElements(): any;
        debugLogs: any[];
        isMainFrame: boolean;
        debugToConsole: boolean;
        waitForFramesReady?: boolean;
        selfFrameIdPath: string;
    }
    function debugLog(message: string, ...args: any[]): void;
}
declare class DomReplayer {
    private paintEvents;
    private loadedIndex;
    private pendingDelegatedEventsByChildNodeId;
    private pendingDomChanges;
    private frameContentWindows;
    constructor();
    reset(): void;
    loadPaintEvents(newPaintEvents: IFrontendDomChangeEvent[][]): void;
    setPaintIndex(index: number): void;
    private applyDomChanges;
    private delegateToChildFrame;
    private sendPendingEvents;
    private setChildFrameIsReady;
    static register(): void;
    static load(): void;
}
export {};
