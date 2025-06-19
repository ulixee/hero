"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const BridgeUtils_1 = require("./lib/BridgeUtils");
const instanceVariations = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/path-patterns/instance-variations.json');
const locationVariations = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/path-patterns/location-variations.json');
const windowVariations = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/path-patterns/window-variations.json');
const devtoolsIndicators = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/path-patterns/devtools-indicators.json');
const headlessIndicators = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/path-patterns/headless-indicators.json');
const browserstackIndicators = unblocked_browser_profiler_1.default.loadDataFile('dom-bridges/path-patterns/browserstack-indicators.json');
class DomBridger {
    static removeDevtoolsFromPolyfill(polyfill) {
        polyfill.add = polyfill.add.filter(x => !isDevtoolsIndicator(x.path, x.propertyName));
        polyfill.remove = polyfill.remove.filter(x => !isDevtoolsIndicator(x.path, x.propertyName));
        polyfill.modify = polyfill.modify.filter(x => !isDevtoolsIndicator(x.path, x.propertyName));
        polyfill.reorder = polyfill.reorder.filter(x => !isDevtoolsIndicator(x.path, x.propertyName) &&
            !isDevtoolsIndicator(x.path, x.prevProperty));
        injectDevtoolsIndicatorPolyfills(polyfill);
    }
    static removeBrowserstackFromPolyfill(polyfill) {
        polyfill.add = polyfill.add.filter(x => {
            return (!browserstackIndicators.added.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(x.path, pattern)) &&
                !browserstackIndicators.extraAdded.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(x.path, pattern)));
        });
        polyfill.modify = polyfill.modify.filter(x => {
            return (!browserstackIndicators.changed.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(x.path, pattern)) &&
                !browserstackIndicators.extraChanged.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(x.path, pattern)));
        });
    }
    static removeHeadlessFromPolyfill(polyfill) {
        polyfill.add = polyfill.add.filter(x => !isHeadlessAdded(x.path, x.propertyName));
        polyfill.remove = injectHeadlessIndicatorsToRemove(polyfill.remove);
    }
    static removeVariationsFromPolyfill(polyfill) {
        polyfill.modify = polyfill.modify.filter(x => !isVariationChange(x.path, x.propertyName));
        polyfill.remove = polyfill.remove.filter(x => !isVariationChange(x.path, x.propertyName));
        polyfill.add = polyfill.add.filter(x => !isVariationChange(x.path, x.propertyName));
        polyfill.reorder = polyfill.reorder.filter(x => !isVariationChange(x.path, x.propertyName) && !isVariationChange(x.path, x.prevProperty));
    }
    static removeCustomCallbackFromPolyfill(polyfill, callback) {
        polyfill.modify = polyfill.modify.filter(x => !callback(x.path, x.propertyName, x.property));
        polyfill.remove = polyfill.remove.filter(x => !callback(x.path, x.propertyName, null));
        polyfill.add = polyfill.add.filter(x => !callback(x.path, x.propertyName, x.property));
    }
}
exports.default = DomBridger;
function isVariationChange(path, propertyName) {
    const internalProperties = ['_$invocation', '_$value'];
    if (!internalProperties.includes(propertyName)) {
        path = `${path}.${propertyName}`;
    }
    if (instanceVariations.changed.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (instanceVariations.extraChanged.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (locationVariations.changed.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (locationVariations.extraChanged.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (windowVariations.changed.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (windowVariations.extraChanged.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (devtoolsIndicators.changed.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (devtoolsIndicators.extraChanged.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (browserstackIndicators.changed.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (browserstackIndicators.extraChanged.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    return false;
}
function isDevtoolsIndicator(path, propertyName) {
    const internalProperties = ['_$invocation', '_$value'];
    if (!internalProperties.includes(propertyName)) {
        path = `${path}.${propertyName}`;
    }
    if (devtoolsIndicators.added.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (devtoolsIndicators.extraAdded.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (devtoolsIndicators.changed.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (devtoolsIndicators.extraChanged.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    return false;
}
function isHeadlessAdded(path, _propertyName) {
    if (headlessIndicators.added.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    if (headlessIndicators.extraAdded.some(pattern => (0, BridgeUtils_1.pathIsPatternMatch)(path, pattern)))
        return true;
    return false;
}
function injectDevtoolsIndicatorPolyfills(polyfill) {
    const toRemove = [...devtoolsIndicators.added, ...devtoolsIndicators.extraAdded];
    for (const fullPath of toRemove) {
        const pathParts = fullPath.split('.');
        const propertyName = pathParts.pop();
        polyfill.remove.push({
            path: pathParts.join('.'),
            propertyName,
        });
    }
}
function injectHeadlessIndicatorsToRemove(remove) {
    const toRemove = [...headlessIndicators.added, ...headlessIndicators.extraAdded];
    for (const fullPath of toRemove) {
        const pathParts = fullPath.split('.');
        const propertyName = pathParts.pop();
        remove.push({
            path: pathParts.join('.'),
            propertyName,
        });
    }
    return remove;
}
//# sourceMappingURL=index.js.map