import { fileURLToPath } from 'url';
import * as fs from 'fs';
import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';
import { SourceMapSupport } from './SourceMapSupport';

export default class SourceLoader {
  private static sourceLines: { [source: string]: string[] } = {};
  private static fileContentsCache: { [filepath: string]: string } = {};

  static resetCache(): void {
    this.sourceLines = {};
    this.fileContentsCache = {};
  }

  static clearFileCache(filepath: string): void {
    delete this.fileContentsCache[filepath];
  }

  static getSource(codeLocation: ISourceCodeLocation): ISourceCodeLocation & { code: string } {
    if (!codeLocation) return null;

    const sourcePosition = SourceMapSupport.getOriginalSourcePosition(codeLocation, true);

    const code = sourcePosition.content;
    if (!this.sourceLines[sourcePosition.filename]) {
      const file = code || this.getFileContents(sourcePosition.filename);
      if (!file) return null;
      this.sourceLines[sourcePosition.filename] = file.split(/\r?\n/);
    }

    (sourcePosition as any).code =
      this.sourceLines[sourcePosition.filename][sourcePosition.line - 1];
    return sourcePosition as any;
  }

  static getFileContents(filepath: string, cache = true): string {
    const cacheKey = SourceMapSupport.getCacheKey(filepath);
    if (cache && this.fileContentsCache[cacheKey]) return this.fileContentsCache[cacheKey];

    // Trim the path to make sure there is no extra whitespace.
    filepath = filepath.trim();
    if (filepath.startsWith('file://')) {
      filepath = fileURLToPath(filepath);
    }

    let data: string = null;
    try {
      data = fs.readFileSync(filepath, 'utf8');
    } catch (err) {
      // couldn't read
    }
    if (cache) {
      this.fileContentsCache[cacheKey] = data;
    }
    return data;
  }

  static setFileContents(filepath: string, data: string): void {
    const cacheKey = SourceMapSupport.getCacheKey(filepath);
    this.fileContentsCache[cacheKey] = data;
  }
}
