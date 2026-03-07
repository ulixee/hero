"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceMapSupport = void 0;
const trace_mapping_1 = require("@jridgewell/trace-mapping");
const path = require("path");
const url_1 = require("url");
const SourceLoader_1 = require("./SourceLoader");
// ATTRIBUTION: forked from https://github.com/cspotcode/node-source-map-support
const sourceMapDataUrlRegex = /^data:application\/json[^,]+base64,/;
const sourceMapUrlRegex = /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/gm;
const fileUrlPrefix = 'file://';
let kIsNodeError;
try {
    // Get a deliberate ERR_INVALID_ARG_TYPE
    // TODO is there a better way to reliably get an instance of NodeError?
    // @ts-ignore
    path.resolve(123);
}
catch (e) {
    const symbols = Object.getOwnPropertySymbols(e);
    const symbol = symbols.find(s => {
        return s.toString().indexOf('kIsNodeError') >= 0;
    });
    if (symbol)
        kIsNodeError = symbol;
}
class SourceMapSupport {
    static clearStackPath(stackPath) {
        this.stackPathsToClear.add(stackPath);
    }
    static resetCache() {
        this.sourceMapCache = {};
        this.cacheKeys = {};
        this.resolvedPathCache = {};
    }
    static clearCache(filepath) {
        this.sourceMapCache[filepath] = null;
    }
    static install() {
        // ts-node does its own translations
        if (process.execArgv?.includes('ts-node'))
            return;
        if (!Error[Symbol.for('source-map-support')]) {
            Error[Symbol.for('source-map-support')] = true;
            Error.prepareStackTrace = this.prepareStackTrace.bind(this);
        }
    }
    static getSourceFile(filename) {
        const sourceMap = this.retrieveSourceMap(filename);
        if (!sourceMap.map)
            return {
                path: filename,
            };
        let sourceIndex = sourceMap.map.sources.indexOf(filename);
        if (sourceIndex === -1)
            sourceIndex = sourceMap.map.resolvedSources.indexOf(filename);
        if (sourceIndex === -1 && sourceMap.map.sources.length === 1)
            sourceIndex = 0;
        const source = sourceIndex >= 0 ? sourceMap.map.resolvedSources[sourceIndex] : filename;
        const content = SourceLoader_1.default.getFileContents(source);
        return { path: source, content };
    }
    static getOriginalSourcePosition(position, includeContent = false) {
        // already translated
        if (position.source) {
            if (includeContent && 'content' in position)
                position.content = SourceLoader_1.default.getFileContents(position.source);
            return position;
        }
        const sourceMap = this.retrieveSourceMap(position.filename);
        // Resolve the source URL relative to the URL of the source map
        if (sourceMap && sourceMap.map) {
            const originalPosition = (0, trace_mapping_1.originalPositionFor)(sourceMap.map, position);
            // Only return the original position if a matching line was found
            if (originalPosition.source !== null) {
                // originalPosition.source has *already* been resolved against sourceMap.url
                // so is *already* as absolute as possible.
                // However, we want to ensure we output in same format as input: URL or native path
                originalPosition.source = matchStyleOfPathOrUrl(position.filename, originalPosition.source);
                let content = null;
                if (includeContent) {
                    content = SourceLoader_1.default.getFileContents(originalPosition.source);
                }
                return {
                    source: originalPosition.source,
                    filename: position.filename,
                    column: originalPosition.column,
                    line: originalPosition.line,
                    name: originalPosition.name,
                    content,
                };
            }
        }
        return position;
    }
    static retrieveSourceMap(source, overrideSourceRoot) {
        const cacheKey = this.getCacheKey(source);
        if (this.sourceMapCache[cacheKey])
            return this.sourceMapCache[cacheKey];
        // Find the *last* sourceMappingURL to avoid picking up sourceMappingURLs from comments, strings, etc.
        let sourceMappingURL;
        let sourceMapData;
        let match;
        const fileData = SourceLoader_1.default.getFileContents(source);
        // eslint-disable-next-line no-cond-assign
        while ((match = sourceMapUrlRegex.exec(fileData))) {
            sourceMappingURL = match[1];
        }
        if (sourceMappingURL) {
            if (sourceMapDataUrlRegex.test(sourceMappingURL)) {
                const rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
                sourceMapData = Buffer.from(rawData, 'base64').toString();
                sourceMappingURL = source;
            }
            else {
                // Support source map URLs relative to the source URL
                sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
                sourceMapData = SourceLoader_1.default.getFileContents(sourceMappingURL);
            }
        }
        if (sourceMapData) {
            if (overrideSourceRoot) {
                const sourceMapJson = JSON.parse(sourceMapData);
                sourceMapJson.sourceRoot = overrideSourceRoot;
                sourceMapJson.sources = sourceMapJson.sources.map(x => {
                    // make relative to new source root
                    if (x.startsWith('..'))
                        return x.substring(1);
                    return x;
                });
                sourceMapData = sourceMapJson;
            }
            // eslint-disable-next-line no-multi-assign
            const sourceMap = {
                url: sourceMappingURL,
                map: new trace_mapping_1.AnyMap(sourceMapData, sourceMappingURL),
                rawMap: sourceMapData,
            };
            this.sourceMapCache[cacheKey] = sourceMap;
            // Overwrite trace-mapping's resolutions, because they do not handle Windows paths the way we want.
            sourceMap.map.resolvedSources = sourceMap.map.sources.map(s => supportRelativeURL(sourceMap.url, s));
            // Load all sources stored inline with the source map into the file cache
            // to pretend like they are already loaded. They may not exist on disk.
            if (sourceMap.map.sourcesContent) {
                sourceMap.map.resolvedSources.forEach((resolvedSource, i) => {
                    const contents = sourceMap.map.sourcesContent[i];
                    if (contents) {
                        SourceLoader_1.default.setFileContents(resolvedSource, contents);
                    }
                });
            }
            else {
                const content = sourceMap.map.resolvedSources.map(x => SourceLoader_1.default.getFileContents(x));
                if (content.some(x => x !== null))
                    sourceMap.map.sourcesContent = content;
            }
        }
        else {
            // eslint-disable-next-line no-multi-assign
            this.sourceMapCache[cacheKey] = {
                url: null,
                map: null,
                rawMap: null,
            };
        }
        return this.sourceMapCache[cacheKey];
    }
    static getCacheKey(pathOrFileUrl) {
        if (this.cacheKeys[pathOrFileUrl])
            return this.cacheKeys[pathOrFileUrl];
        let result = pathOrFileUrl.trim();
        try {
            if (pathOrFileUrl.startsWith(fileUrlPrefix)) {
                // Must normalize spaces to %20, stuff like that
                result = new URL(pathOrFileUrl).toString();
            }
            else if (!result.startsWith('node:')) {
                result = (0, url_1.pathToFileURL)(pathOrFileUrl).toString();
            }
        }
        catch {
            // keep original url
        }
        this.cacheKeys[pathOrFileUrl] = result;
        return result;
    }
    static resolvePath(base, relative) {
        if (!base)
            return relative;
        const key = `${base}__${relative}`;
        if (!this.resolvedPathCache[key]) {
            let protocol = base.startsWith(fileUrlPrefix) ? fileUrlPrefix : '';
            let basePath = path.dirname(base).slice(protocol.length);
            // handle file:///C:/ paths
            if (protocol && /^\/\w:/.test(basePath)) {
                protocol += '/';
                basePath = basePath.slice(1);
            }
            this.resolvedPathCache[key] = protocol + path.resolve(basePath, relative);
        }
        return this.resolvedPathCache[key];
    }
    static prepareStackTrace(error, stack) {
        // node gives its own errors special treatment.  Mimic that behavior
        // https://github.com/nodejs/node/blob/3cbaabc4622df1b4009b9d026a1a970bdbae6e89/lib/internal/errors.js#L118-L128
        // https://github.com/nodejs/node/pull/39182
        let errorString;
        if (kIsNodeError) {
            if (kIsNodeError in error) {
                errorString = `${error.name} [${error.code}]: ${error.message}`;
            }
            else {
                errorString = ErrorPrototypeToString(error);
            }
        }
        else {
            const name = error.name ?? error[Symbol.toStringTag] ?? error.constructor?.name ?? 'Error';
            const message = error.message ?? '';
            errorString = message ? `${name}: ${message}` : name;
        }
        // track fn name as we go backwards through stack
        const processedStack = [];
        let containingFnName = null;
        for (let i = stack.length - 1; i >= 0; i--) {
            let frame = stack[i];
            if (frame.isNative()) {
                containingFnName = null;
            }
            else {
                const filename = frame.getFileName() || frame.getScriptNameOrSourceURL();
                if (filename && !filename.endsWith('.ts')) {
                    const position = this.getOriginalSourcePosition({
                        filename,
                        line: frame.getLineNumber(),
                        column: frame.getColumnNumber() - 1,
                    });
                    if (position.source) {
                        const fnName = containingFnName ?? frame.getFunctionName();
                        for (const toReplace of this.stackPathsToClear) {
                            if (position.source.startsWith(toReplace)) {
                                position.source = position.source.replace(toReplace, '');
                            }
                        }
                        containingFnName = position.name;
                        frame = new Proxy(frame, {
                            get(target, p) {
                                if (p === 'getFunctionName')
                                    return () => fnName;
                                if (p === 'getFileName')
                                    return () => position.source;
                                if (p === 'getScriptNameOrSourceURL')
                                    return () => position.source;
                                if (p === 'getLineNumber')
                                    return () => position.line;
                                if (p === 'getColumnNumber')
                                    return () => position.column + 1;
                                if (p === 'toString')
                                    return CallSiteToString.bind(frame);
                                return target[p]?.bind(target);
                            },
                        });
                    }
                }
            }
            processedStack.unshift(`\n    at ${frame.toString()}`);
        }
        return errorString + processedStack.join('');
    }
}
exports.SourceMapSupport = SourceMapSupport;
SourceMapSupport.sourceMapCache = {};
SourceMapSupport.resolvedPathCache = {};
SourceMapSupport.cacheKeys = {};
SourceMapSupport.stackPathsToClear = new Set();
SourceMapSupport.install();
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ErrorPrototypeToString = err => Error.prototype.toString.call(err);
// This is copied almost verbatim from the V8 source code at
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js
// Update 2022-04-29:
//    https://github.com/v8/v8/blob/98f6f100c5ab8e390e51422747c4ef644d5ac6f2/src/builtins/builtins-callsite.cc#L175-L179
//    https://github.com/v8/v8/blob/98f6f100c5ab8e390e51422747c4ef644d5ac6f2/src/objects/call-site-info.cc#L795-L804
//    https://github.com/v8/v8/blob/98f6f100c5ab8e390e51422747c4ef644d5ac6f2/src/objects/call-site-info.cc#L717-L750
// The implementation of wrapCallSite() used to just forward to the actual source
// code of CallSite.prototype.toString but unfortunately a new release of V8
// did something to the prototype chain and broke the shim. The only fix I
// could find was copy/paste.
function CallSiteToString() {
    let fileName;
    let fileLocation = '';
    if (this.isNative()) {
        fileLocation = 'native';
    }
    else {
        fileName = this.getScriptNameOrSourceURL();
        if (!fileName && this.isEval()) {
            fileLocation = this.getEvalOrigin();
            fileLocation += ', '; // Expecting source position to follow.
        }
        if (fileName) {
            fileLocation += fileName;
        }
        else {
            // Source code does not originate from a file and is not native, but we
            // can still get the source position inside the source string, e.g. in
            // an eval string.
            fileLocation += '<anonymous>';
        }
        const lineNumber = this.getLineNumber();
        if (lineNumber != null) {
            fileLocation += `:${lineNumber}`;
            const columnNumber = this.getColumnNumber();
            if (columnNumber) {
                fileLocation += `:${columnNumber}`;
            }
        }
    }
    let line = '';
    const isAsync = this.isAsync ? this.isAsync() : false;
    if (isAsync) {
        line += 'async ';
        const isPromiseAll = this.isPromiseAll ? this.isPromiseAll() : false;
        const isPromiseAny = this.isPromiseAny ? this.isPromiseAny() : false;
        if (isPromiseAny || isPromiseAll) {
            line += isPromiseAll ? 'Promise.all (index ' : 'Promise.any (index ';
            const promiseIndex = this.getPromiseIndex();
            line += `${promiseIndex})`;
        }
    }
    const functionName = this.getFunctionName();
    let addSuffix = true;
    const isConstructor = this.isConstructor();
    const isMethodCall = !(this.isToplevel() || isConstructor);
    if (isMethodCall) {
        const typeName = this.getTypeName();
        const methodName = this.getMethodName();
        if (functionName) {
            if (typeName && functionName.indexOf(typeName) !== 0) {
                line += `${typeName}.`;
            }
            line += functionName;
            if (methodName &&
                functionName.indexOf(`.${methodName}`) !== functionName.length - methodName.length - 1) {
                line += ` [as ${methodName}]`;
            }
        }
        else {
            line += `${typeName}.${methodName || '<anonymous>'}`;
        }
    }
    else if (isConstructor) {
        line += `new ${functionName || '<anonymous>'}`;
    }
    else if (functionName) {
        line += functionName;
    }
    else {
        line += fileLocation;
        addSuffix = false;
    }
    if (addSuffix) {
        line += ` (${fileLocation})`;
    }
    return line;
}
// Matches the scheme of a URL, eg "http://"
const schemeRegex = /^[\w+.-]+:\/\//;
function isAbsoluteUrl(input) {
    return schemeRegex.test(input);
}
function isSchemeRelativeUrl(input) {
    return input.startsWith('//');
}
// Support URLs relative to a directory, but be careful about a protocol prefix
// in case we are in the browser (i.e. directories may start with "http://" or "file:///")
function supportRelativeURL(file, url) {
    if (!file)
        return url;
    // given that this happens within error formatting codepath, probably best to
    // fallback instead of throwing if anything goes wrong
    try {
        // if should output a URL
        if (isAbsoluteUrl(file) || isSchemeRelativeUrl(file)) {
            if (isAbsoluteUrl(url) || isSchemeRelativeUrl(url)) {
                return new URL(url, file).toString();
            }
            if (path.isAbsolute(url)) {
                return new URL((0, url_1.pathToFileURL)(url), file).toString();
            }
            // url is relative path or URL
            return new URL(url.replace(/\\/g, '/'), file).toString();
        }
        // if should output a path (unless URL is something like https://)
        if (path.isAbsolute(file)) {
            if (url.startsWith(fileUrlPrefix)) {
                return (0, url_1.fileURLToPath)(url);
            }
            if (isSchemeRelativeUrl(url)) {
                return (0, url_1.fileURLToPath)(new URL(url, fileUrlPrefix));
            }
            if (isAbsoluteUrl(url)) {
                // url is a non-file URL
                // Go with the URL
                return url;
            }
            if (path.isAbsolute(url)) {
                // Normalize at all?  decodeURI or normalize slashes?
                return path.normalize(url);
            }
            // url is relative path or URL
            return path.join(file, '..', decodeURI(url));
        }
        // If we get here, file is relative.
        // Shouldn't happen since node identifies modules with absolute paths or URLs.
        // But we can take a stab at returning something meaningful anyway.
        if (isAbsoluteUrl(url) || isSchemeRelativeUrl(url)) {
            return url;
        }
        return path.join(file, '..', url);
    }
    catch (e) {
        return url;
    }
}
// Return pathOrUrl in the same style as matchStyleOf: either a file URL or a native path
function matchStyleOfPathOrUrl(matchStyleOf, pathOrUrl) {
    try {
        if (isAbsoluteUrl(matchStyleOf) || isSchemeRelativeUrl(matchStyleOf)) {
            if (isAbsoluteUrl(pathOrUrl) || isSchemeRelativeUrl(pathOrUrl))
                return pathOrUrl;
            if (path.isAbsolute(pathOrUrl))
                return (0, url_1.pathToFileURL)(pathOrUrl).toString();
        }
        else if (path.isAbsolute(matchStyleOf)) {
            if (isAbsoluteUrl(pathOrUrl) || isSchemeRelativeUrl(pathOrUrl)) {
                return (0, url_1.fileURLToPath)(new URL(pathOrUrl, fileUrlPrefix));
            }
        }
        return pathOrUrl;
    }
    catch (e) {
        return pathOrUrl;
    }
}
//# sourceMappingURL=SourceMapSupport.js.map