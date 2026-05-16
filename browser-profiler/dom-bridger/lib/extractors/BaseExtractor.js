"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BridgeUtils_1 = require("../BridgeUtils");
class BaseExtractor {
    constructor(rawMappings) {
        this.definitePathsFound = new Set();
        this.extraPathsFound = new Set();
        this.definitePathsMap = {
            added: new Set(),
            removed: new Set(),
            changed: new Set(),
            changedOrder: new Set(),
        };
        this.regexpsUsedForMatch = new Set();
        for (const pathType of Object.keys(this.definitePathsMap)) {
            for (const path of Object.keys(rawMappings[pathType] ?? {})) {
                this.addDefinitePath(path, pathType);
            }
        }
    }
    evaluate(paths) {
        const Extractor = this.constructor;
        for (const path of paths) {
            const regexps = Extractor.getRegexps(path);
            if (!regexps.length)
                continue;
            for (const regexp of regexps) {
                this.regexpsUsedForMatch.add(regexp);
            }
            if (!Extractor.isIgnoredExtraPath(path))
                this.extraPathsFound.add(path);
        }
    }
    get handledPatterns() {
        const Extractor = this.constructor;
        return [
            ...Extractor.definitePatterns,
            ...Extractor.extraAddPatterns,
            ...Extractor.extraChangePatterns,
        ];
    }
    // MATCHED means raw bridge paths that were found in static definitePaths array
    get definitePathsMatched() {
        return [].concat(...Object.values(this.definitePathsMap).map(x => Array.from(x)));
    }
    // NOT MATCHED means raw bridge paths that were NOT found in pathsToIgnore AND NOT in static definitePaths array
    get definitePathsNotMatched() {
        const Extractor = this.constructor;
        return Array.from(this.definitePathsFound).filter(path => {
            if (this.patternsHandledElsewhere.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x)))
                return false;
            return !Extractor.definitePatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
    }
    get definitePathsHandledElsewhere() {
        return Array.from(this.definitePathsFound).filter(path => {
            return this.patternsHandledElsewhere.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
    }
    get definitePatternsNotUsed() {
        const Extractor = this.constructor;
        const definitePathsFound = Array.from(this.definitePathsFound);
        return Extractor.definitePatterns.filter(x => {
            return !definitePathsFound.some(path => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
    }
    get extraPathsMatched() {
        const Extractor = this.constructor;
        return Array.from(this.extraPathsFound).filter(path => {
            if (Extractor.definitePatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x)))
                return false;
            if (Extractor.extraAddPatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x)))
                return true;
            return Extractor.extraChangePatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
    }
    get extraPathsNotMatched() {
        const Extractor = this.constructor;
        return Array.from(this.extraPathsFound).filter(path => {
            if (Extractor.definitePatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x)))
                return false;
            if (this.patternsHandledElsewhere.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x)))
                return false;
            if (Extractor.extraAddPatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x)))
                return false;
            return !Extractor.extraChangePatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
    }
    get extraPathsHandledElsewhere() {
        return Array.from(this.extraPathsFound).filter(path => {
            return this.patternsHandledElsewhere.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
    }
    get regexpsUsed() {
        return Array.from(this.regexpsUsedForMatch);
    }
    setAsHandled(...groupsOfPaths) {
        this.patternsHandledElsewhere = [].concat(...groupsOfPaths);
    }
    toJSON() {
        const Extractor = this.constructor;
        const addedPatterns = Array.from(this.definitePathsMap.added).map(path => {
            return Extractor.definitePatterns.find(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
        const removedPatterns = Array.from(this.definitePathsMap.removed).map(path => {
            return Extractor.definitePatterns.find(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
        const changedPatterns = Array.from(this.definitePathsMap.changed).map(path => {
            return Extractor.definitePatterns.find(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
        const changedOrderPatterns = Array.from(this.definitePathsMap.changedOrder).map(path => {
            return Extractor.definitePatterns.find(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        });
        const extraAddPatterns = Array.from(this.extraPathsMatched)
            .map(path => {
            return Extractor.extraAddPatterns.find(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        })
            .filter(path => path !== undefined);
        const extraChangePatterns = Array.from(this.extraPathsMatched)
            .map(path => {
            return Extractor.extraChangePatterns.find(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
        })
            .filter(path => path !== undefined);
        return {
            added: Array.from(new Set(addedPatterns)),
            removed: Array.from(new Set(removedPatterns)),
            changed: Array.from(new Set(changedPatterns)),
            changedOrder: Array.from(new Set(changedOrderPatterns)),
            extraAdded: Array.from(new Set(extraAddPatterns)),
            extraChanged: Array.from(new Set(extraChangePatterns)),
        };
    }
    getRegexps(path) {
        const Extractor = this.constructor;
        return Extractor.getRegexps(path);
    }
    // PRIVATE
    addDefinitePath(path, pathType) {
        this.definitePathsFound.add(path);
        const isDefinitive = this.constructor.isDefinitePath(path);
        if (isDefinitive) {
            this.definitePathsMap[pathType].add(path);
        }
    }
    // PUBLIC STATIC
    static isDefinitePath(path) {
        return this.definitePatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
    }
    static fitsAnyPattern(path) {
        const allPatterns = [
            ...this.definitePatterns,
            ...this.extraAddPatterns,
            ...this.extraChangePatterns,
        ];
        return allPatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
    }
    static isIgnoredExtraPath(path) {
        return this.ignoredExtraPatterns.some(x => (0, BridgeUtils_1.pathIsPatternMatch)(path, x));
    }
    static getRegexps(path) {
        return this.regexps.filter(x => x.test(path));
    }
}
exports.default = BaseExtractor;
//# sourceMappingURL=BaseExtractor.js.map