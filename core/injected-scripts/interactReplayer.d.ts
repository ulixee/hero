import type { IScrollRecord } from '@ulixee/hero-core/models/ScrollEventsTable';
import type { IMouseEventRecord } from '@ulixee/hero-core/models/MouseEventsTable';
declare global {
    interface Window {
        selfFrameIdPath: string;
        blockClickAndSubmit: boolean;
        debugLogs: any[];
        debugToConsole: boolean;
        showMouseInteractions: boolean;
        repositionInteractElements(): any;
        replayInteractions(resultNodeIds?: IHighlightedNodes, mouseEvent?: IFrontendMouseEvent, scrollEvent?: IFrontendScrollEvent): any;
        setInteractionDisplay(trackMouse: boolean, hideMouse: boolean, hideOverlays: boolean): any;
        getNodeById(id: number): Node;
    }
}
export interface IHighlightedNodes {
    frameIdPath: string;
    nodeIds: number[];
}
export interface IFrontendMouseEvent extends Omit<IMouseEventRecord, 'frameId' | 'tabId' | 'commandId' | 'timestamp' | 'event'> {
    frameIdPath: string;
}
export interface IFrontendScrollEvent extends Omit<IScrollRecord, 'frameId' | 'tabId' | 'commandId' | 'timestamp'> {
    frameIdPath: string;
}
