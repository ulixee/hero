"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadStatusPipeline = exports.LocationStatus = exports.LocationTrigger = exports.LoadStatus = void 0;
var LoadStatus;
(function (LoadStatus) {
    LoadStatus["NavigationRequested"] = "NavigationRequested";
    LoadStatus["HttpRequested"] = "HttpRequested";
    LoadStatus["HttpRedirected"] = "HttpRedirected";
    LoadStatus["HttpResponded"] = "HttpResponded";
    LoadStatus["JavascriptReady"] = "JavascriptReady";
    LoadStatus["DomContentLoaded"] = "DomContentLoaded";
    LoadStatus["PaintingStable"] = "PaintingStable";
    LoadStatus["AllContentLoaded"] = "AllContentLoaded";
})(LoadStatus || (exports.LoadStatus = LoadStatus = {}));
var LocationTrigger;
(function (LocationTrigger) {
    LocationTrigger["reload"] = "reload";
    LocationTrigger["change"] = "change";
})(LocationTrigger || (exports.LocationTrigger = LocationTrigger = {}));
exports.LocationStatus = { ...LocationTrigger, ...LoadStatus };
const LoadStatusPipeline = {
    NavigationRequested: 0,
    HttpRequested: 1,
    HttpRedirected: 2,
    HttpResponded: 3,
    JavascriptReady: 4,
    DomContentLoaded: 5,
    PaintingStable: 6,
    AllContentLoaded: 7,
};
exports.LoadStatusPipeline = LoadStatusPipeline;
//# sourceMappingURL=Location.js.map