import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';
import { SourceMapSupport } from './SourceMapSupport';
import { URL } from 'url';
import * as fs from 'fs';

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

    codeLocation = SourceMapSupport.getOriginalSourcePosition(codeLocation);

    if (!this.sourceLines[codeLocation.filename]) {
      const file = this.getFileContents(codeLocation.filename);
      if (!file) return null;
      this.sourceLines[codeLocation.filename] = file.split(/\r?\n/);
    }

    const code = this.sourceLines[codeLocation.filename][codeLocation.line - 1];
    return {
      code,
      ...codeLocation,
    };
  }

  static getFileContents(filepath: string, cache = true): string {
    if (cache && this.fileContentsCache[filepath]) return this.fileContentsCache[filepath];

    const originalFilepath = filepath;
    // Trim the path to make sure there is no extra whitespace.
    let lookupFilepath: string | URL = filepath.trim();
    if (filepath.startsWith('file://')) {
      lookupFilepath = new URL(filepath);
    }

    let data: string = null;
    try {
      data = fs.readFileSync(lookupFilepath, 'utf8');
    } catch (err) {
      // couldn't read
    }
    if (cache) {
      this.fileContentsCache[filepath] = data;
      this.fileContentsCache[originalFilepath] = data;
    }
    return data;
  }
}
