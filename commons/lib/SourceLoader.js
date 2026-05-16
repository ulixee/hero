"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const url_1 = require("url");
const SourceMapSupport_1 = require("./SourceMapSupport");
class SourceLoader {
    static resetCache() {
        this.sourceLines = {};
        this.fileContentsCache = {};
    }
    static clearFileCache(filepath) {
        delete this.fileContentsCache[filepath];
    }
    static getSource(codeLocation) {
        if (!codeLocation)
            return null;
        const sourcePosition = SourceMapSupport_1.SourceMapSupport.getOriginalSourcePosition(codeLocation, true);
        const code = sourcePosition.content;
        if (!this.sourceLines[sourcePosition.source]) {
            const file = code || this.getFileContents(sourcePosition.source);
            if (!file)
                return null;
            this.sourceLines[sourcePosition.source] = file.split(/\r?\n/);
        }
        sourcePosition.code = this.sourceLines[sourcePosition.source][sourcePosition.line - 1];
        return sourcePosition;
    }
    static getSourceLines(codeLocation) {
        if (!codeLocation)
            return [];
        const source = this.getSource(codeLocation);
        if (source?.code)
            return this.sourceLines[source.source];
        return [];
    }
    static getFileContents(filepath, cache = true) {
        if (!filepath)
            return null;
        const cacheKey = SourceMapSupport_1.SourceMapSupport.getCacheKey(filepath);
        if (cache && cacheKey in this.fileContentsCache)
            return this.fileContentsCache[cacheKey];
        // Trim the path to make sure there is no extra whitespace.
        let lookupFilepath = filepath.trim();
        if (filepath.startsWith('file://')) {
            lookupFilepath = new url_1.URL(filepath);
        }
        let data = null;
        try {
            data = fs.readFileSync(lookupFilepath, 'utf8');
        }
        catch (err) {
            // couldn't read
        }
        if (cache) {
            this.fileContentsCache[cacheKey] = data;
        }
        return data;
    }
    static setFileContents(filepath, data) {
        const cacheKey = SourceMapSupport_1.SourceMapSupport.getCacheKey(filepath);
        this.fileContentsCache[cacheKey] = data;
    }
}
SourceLoader.sourceLines = {};
SourceLoader.fileContentsCache = {};
exports.default = SourceLoader;
//# sourceMappingURL=SourceLoader.js.map