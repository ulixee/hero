import { AnyMap, originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';
import SourceLoader from './SourceLoader';

// ATTRIBUTION: forked from https://github.com/cspotcode/node-source-map-support

const sourceMapDataUrlRegex = /^data:application\/json[^,]+base64,/;
const sourceMapUrlRegex =
  /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/gm;
const fileUrlPrefix = 'file://';

let kIsNodeError: symbol;
try {
  // Get a deliberate ERR_INVALID_ARG_TYPE
  // TODO is there a better way to reliably get an instance of NodeError?
  // @ts-ignore
  path.resolve(123);
} catch (e) {
  const symbols = Object.getOwnPropertySymbols(e);
  const symbol = symbols.find(s => {
    return s.toString().indexOf('kIsNodeError') >= 0;
  });
  if (symbol) kIsNodeError = symbol;
}

export class SourceMapSupport {
  private static sourceMapCache: {
    [source: string]: { map: TraceMap; url: string; rawMap: any };
  } = {};

  private static resolvedPathCache: { [file_url: string]: string } = {};
  private static cacheKeys: { [file_url: string]: string } = {};
  private static stackPathsToClear = new Set<string>();

  static clearStackPath(stackPath: string): void {
    this.stackPathsToClear.add(stackPath);
  }

  static resetCache(): void {
    this.sourceMapCache = {};
    this.cacheKeys = {};
    this.resolvedPathCache = {};
  }

  static clearCache(filepath: string): void {
    this.sourceMapCache[filepath] = null;
  }

  static install(): void {
    // ts-node does its own translations
    if (process.execArgv?.includes('ts-node')) return;

    if (!Error[Symbol.for('source-map-support')]) {
      Error[Symbol.for('source-map-support')] = true;
      Error.prepareStackTrace = this.prepareStackTrace.bind(this);
    }
  }

  static getSourceFile(filename: string): { path: string; content?: string } {
    const sourceMap = this.retrieveSourceMap(filename);
    if (!sourceMap.map)
      return {
        path: filename,
      };

    let sourceIndex = sourceMap.map.sources.indexOf(filename);
    if (sourceIndex === -1) sourceIndex = sourceMap.map.resolvedSources.indexOf(filename);

    if (sourceIndex === -1 && sourceMap.map.sources.length === 1) sourceIndex = 0;

    const source = sourceIndex >= 0 ? sourceMap.map.resolvedSources[sourceIndex] : filename;
    const content = SourceLoader.getFileContents(source);
    return { path: source, content };
  }

  static getOriginalSourcePosition(
    position: ISourceCodeLocation,
    includeContent = false,
  ): ISourceCodeLocation & { name?: string; content?: string } {
    // already translated
    if (position.source) {
      if (includeContent && 'content' in position)
        (position as any).content = SourceLoader.getFileContents(position.source);
      return position;
    }
    const sourceMap = this.retrieveSourceMap(position.filename);

    // Resolve the source URL relative to the URL of the source map
    if (sourceMap && sourceMap.map) {
      const originalPosition = originalPositionFor(sourceMap.map, position);

      // Only return the original position if a matching line was found
      if (originalPosition.source !== null) {
        // originalPosition.source has *already* been resolved against sourceMap.url
        // so is *already* as absolute as possible.
        // However, we want to ensure we output in same format as input: URL or native path
        originalPosition.source = matchStyleOfPathOrUrl(position.filename, originalPosition.source);
        let content: string = null;
        if (includeContent) {
          content = SourceLoader.getFileContents(originalPosition.source);
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

  static retrieveSourceMap(
    source: string,
    overrideSourceRoot?: string,
  ): {
    url: string;
    map: TraceMap;
    rawMap: any;
  } {
    const cacheKey = this.getCacheKey(source);
    if (this.sourceMapCache[cacheKey]) return this.sourceMapCache[cacheKey];

    // Find the *last* sourceMappingURL to avoid picking up sourceMappingURLs from comments, strings, etc.
    let sourceMappingURL: string;
    let sourceMapData: string | any;

    let match: RegExpMatchArray;
    const fileData = SourceLoader.getFileContents(source);
    // eslint-disable-next-line no-cond-assign
    while ((match = sourceMapUrlRegex.exec(fileData))) {
      sourceMappingURL = match[1];
    }

    if (sourceMappingURL) {
      if (sourceMapDataUrlRegex.test(sourceMappingURL)) {
        const rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
        sourceMapData = Buffer.from(rawData, 'base64').toString();
        sourceMappingURL = source;
      } else {
        // Support source map URLs relative to the source URL
        sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
        sourceMapData = SourceLoader.getFileContents(sourceMappingURL);
      }
    }

    if (sourceMapData) {
      if (overrideSourceRoot) {
        const sourceMapJson = JSON.parse(sourceMapData);
        sourceMapJson.sourceRoot = overrideSourceRoot;
        sourceMapJson.sources = sourceMapJson.sources.map(x => {
          // make relative to new source root
          if (x.startsWith('..')) return x.substring(1);
          return x;
        });
        sourceMapData = sourceMapJson;
      }
      // eslint-disable-next-line no-multi-assign
      const sourceMap = {
        url: sourceMappingURL,
        map: new AnyMap(sourceMapData, sourceMappingURL),
        rawMap: sourceMapData,
      };
      this.sourceMapCache[cacheKey] = sourceMap;
      // Overwrite trace-mapping's resolutions, because they do not handle Windows paths the way we want.
      sourceMap.map.resolvedSources = sourceMap.map.sources.map(s =>
        supportRelativeURL(sourceMap.url, s),
      );

      // Load all sources stored inline with the source map into the file cache
      // to pretend like they are already loaded. They may not exist on disk.
      if (sourceMap.map.sourcesContent) {
        sourceMap.map.resolvedSources.forEach((resolvedSource, i) => {
          const contents = sourceMap.map.sourcesContent[i];
          if (contents) {
            SourceLoader.setFileContents(resolvedSource, contents);
          }
        });
      } else {
        const content = sourceMap.map.resolvedSources.map(x => SourceLoader.getFileContents(x));
        if (content.some(x => x !== null)) sourceMap.map.sourcesContent = content;
      }
    } else {
      // eslint-disable-next-line no-multi-assign
      this.sourceMapCache[cacheKey] = {
        url: null,
        map: null,
        rawMap: null,
      };
    }

    return this.sourceMapCache[cacheKey];
  }

  public static getCacheKey(pathOrFileUrl): string {
    if (this.cacheKeys[pathOrFileUrl]) return this.cacheKeys[pathOrFileUrl];

    let result = pathOrFileUrl.trim();

    try {
      if (pathOrFileUrl.startsWith(fileUrlPrefix)) {
        // Must normalize spaces to %20, stuff like that
        result = new URL(pathOrFileUrl).toString();
      } else if (!result.startsWith('node:')) {
        result = pathToFileURL(pathOrFileUrl).toString();
      }
    } catch {
      // keep original url
    }
    this.cacheKeys[pathOrFileUrl] = result;
    return result;
  }

  private static resolvePath(base: string, relative: string): string {
    if (!base) return relative;
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

  private static prepareStackTrace(error: Error, stack: NodeJS.CallSite[]): string {
    // node gives its own errors special treatment.  Mimic that behavior
    // https://github.com/nodejs/node/blob/3cbaabc4622df1b4009b9d026a1a970bdbae6e89/lib/internal/errors.js#L118-L128
    // https://github.com/nodejs/node/pull/39182
    let errorString: string;

    if (kIsNodeError) {
      if (kIsNodeError in error) {
        errorString = `${error.name} [${(error as any).code}]: ${error.message}`;
      } else {
        errorString = ErrorPrototypeToString(error);
      }
    } else {
      const name = error.name ?? error[Symbol.toStringTag] ?? error.constructor?.name ?? 'Error';
      const message = error.message ?? '';
      errorString = message ? `${name}: ${message}` : name;
    }

    // track fn name as we go backwards through stack
    const processedStack = [];
    let containingFnName: string = null;
    for (let i = stack.length - 1; i >= 0; i--) {
      let frame = stack[i];
      if (frame.isNative()) {
        containingFnName = null;
      } else {
        const filename = frame.getFileName() || (frame as any).getScriptNameOrSourceURL();
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
              get(target: NodeJS.CallSite, p: string | symbol): any {
                if (p === 'getFunctionName') return () => fnName;
                if (p === 'getFileName') return () => position.source;
                if (p === 'getScriptNameOrSourceURL') return () => position.source;
                if (p === 'getLineNumber') return () => position.line;
                if (p === 'getColumnNumber') return () => position.column + 1;
                if (p === 'toString') return CallSiteToString.bind(frame);

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
function CallSiteToString(): string {
  let fileName;
  let fileLocation = '';
  if (this.isNative()) {
    fileLocation = 'native';
  } else {
    fileName = this.getScriptNameOrSourceURL();
    if (!fileName && this.isEval()) {
      fileLocation = this.getEvalOrigin();
      fileLocation += ', '; // Expecting source position to follow.
    }

    if (fileName) {
      fileLocation += fileName;
    } else {
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
      if (
        methodName &&
        functionName.indexOf(`.${methodName}`) !== functionName.length - methodName.length - 1
      ) {
        line += ` [as ${methodName}]`;
      }
    } else {
      line += `${typeName}.${methodName || '<anonymous>'}`;
    }
  } else if (isConstructor) {
    line += `new ${functionName || '<anonymous>'}`;
  } else if (functionName) {
    line += functionName;
  } else {
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
function isAbsoluteUrl(input: string): boolean {
  return schemeRegex.test(input);
}

function isSchemeRelativeUrl(input: string): boolean {
  return input.startsWith('//');
}

// Support URLs relative to a directory, but be careful about a protocol prefix
// in case we are in the browser (i.e. directories may start with "http://" or "file:///")
function supportRelativeURL(file: string, url: string): string {
  if (!file) return url;
  // given that this happens within error formatting codepath, probably best to
  // fallback instead of throwing if anything goes wrong
  try {
    // if should output a URL
    if (isAbsoluteUrl(file) || isSchemeRelativeUrl(file)) {
      if (isAbsoluteUrl(url) || isSchemeRelativeUrl(url)) {
        return new URL(url, file).toString();
      }
      if (path.isAbsolute(url)) {
        return new URL(pathToFileURL(url), file).toString();
      }
      // url is relative path or URL
      return new URL(url.replace(/\\/g, '/'), file).toString();
    }

    // if should output a path (unless URL is something like https://)
    if (path.isAbsolute(file)) {
      if (url.startsWith(fileUrlPrefix)) {
        return fileURLToPath(url);
      }
      if (isSchemeRelativeUrl(url)) {
        return fileURLToPath(new URL(url, fileUrlPrefix));
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
  } catch (e) {
    return url;
  }
}

// Return pathOrUrl in the same style as matchStyleOf: either a file URL or a native path
function matchStyleOfPathOrUrl(matchStyleOf: string, pathOrUrl: string): string {
  try {
    if (isAbsoluteUrl(matchStyleOf) || isSchemeRelativeUrl(matchStyleOf)) {
      if (isAbsoluteUrl(pathOrUrl) || isSchemeRelativeUrl(pathOrUrl)) return pathOrUrl;
      if (path.isAbsolute(pathOrUrl)) return pathToFileURL(pathOrUrl).toString();
    } else if (path.isAbsolute(matchStyleOf)) {
      if (isAbsoluteUrl(pathOrUrl) || isSchemeRelativeUrl(pathOrUrl)) {
        return fileURLToPath(new URL(pathOrUrl, fileUrlPrefix));
      }
    }
    return pathOrUrl;
  } catch (e) {
    return pathOrUrl;
  }
}
