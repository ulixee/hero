export declare enum LoadStatus {
    NavigationRequested = "NavigationRequested",
    HttpRequested = "HttpRequested",
    HttpRedirected = "HttpRedirected",
    HttpResponded = "HttpResponded",
    JavascriptReady = "JavascriptReady",
    DomContentLoaded = "DomContentLoaded",
    PaintingStable = "PaintingStable",
    AllContentLoaded = "AllContentLoaded"
}
export declare enum LocationTrigger {
    reload = "reload",
    change = "change"
}
export declare const LocationStatus: {
    readonly NavigationRequested: LoadStatus.NavigationRequested;
    readonly HttpRequested: LoadStatus.HttpRequested;
    readonly HttpRedirected: LoadStatus.HttpRedirected;
    readonly HttpResponded: LoadStatus.HttpResponded;
    readonly JavascriptReady: LoadStatus.JavascriptReady;
    readonly DomContentLoaded: LoadStatus.DomContentLoaded;
    readonly PaintingStable: LoadStatus.PaintingStable;
    readonly AllContentLoaded: LoadStatus.AllContentLoaded;
    readonly reload: LocationTrigger.reload;
    readonly change: LocationTrigger.change;
};
declare const LoadStatusPipeline: {
    readonly NavigationRequested: 0;
    readonly HttpRequested: 1;
    readonly HttpRedirected: 2;
    readonly HttpResponded: 3;
    readonly JavascriptReady: 4;
    readonly DomContentLoaded: 5;
    readonly PaintingStable: 6;
    readonly AllContentLoaded: 7;
};
export { LoadStatusPipeline };
export type IDomPaintEvent = 'DomContentLoaded' | 'AllContentLoaded' | 'LargestContentfulPaint' | 'FirstContentfulPaint';
export type LocationStatus = keyof typeof LocationStatus;
export type ILoadStatus = keyof typeof LoadStatus;
export type ILocationTrigger = keyof typeof LocationTrigger;
