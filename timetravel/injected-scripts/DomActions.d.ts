import { IFrontendDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
declare global {
    interface Window {
        getNodeById(id: number): Node;
        DomActions: typeof DomActions;
    }
}
declare enum DomActionType {
    newDocument = 0,
    location = 1,
    added = 2,
    removed = 3,
    text = 4,
    attribute = 5,
    property = 6
}
declare class DomActions {
    static onFrameModifiedCallbacks: ((element: HTMLIFrameElement | HTMLFrameElement, change: IFrontendDomChangeEvent) => void)[];
    static replayDomEvent(event: IFrontendDomChangeEvent, isReverse?: boolean): void;
    static getNode(id: number): Node;
    static isNavigation(action: DomActionType): boolean;
    private static onFrameModified;
    private static isPreservedElement;
    private static onNodeAdded;
    private static trackPreviousState;
    private static onNodeRemoved;
    private static onNewDocument;
    private static onLocation;
    private static setNodeAttributes;
    private static setNodeProperties;
    private static deserializeNode;
}
export {};
