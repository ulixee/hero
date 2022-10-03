import { pathIsPatternMatch } from '../BridgeUtils';
import IBridgeDefinitions from '../../interfaces/IBridgeDefinitions';

type IPathType = 'added' | 'removed' | 'changed' | 'changedOrder';

export default abstract class BaseExtractor {
  public static definitePatterns: string[];
  public static extraAddPatterns: string[];
  public static extraChangePatterns: string[];
  public static ignoredExtraPatterns: string[];
  public static regexps: RegExp[];

  public patternsHandledElsewhere: string[];

  public definitePathsFound: Set<string> = new Set();
  public extraPathsFound: Set<string> = new Set();

  private definitePathsMap: {
    added: Set<string>;
    removed: Set<string>;
    changed: Set<string>;
    changedOrder: Set<string>;
  } = {
    added: new Set(),
    removed: new Set(),
    changed: new Set(),
    changedOrder: new Set(),
  };

  private regexpsUsedForMatch: Set<RegExp> = new Set();

  constructor(rawMappings: any) {
    for (const pathType of Object.keys(this.definitePathsMap)) {
      for (const path of Object.keys(rawMappings[pathType] ?? {})) {
        this.addDefinitePath(path, pathType as IPathType);
      }
    }
  }

  public evaluate(paths: string[]): void {
    const Extractor = this.constructor as typeof BaseExtractor;
    for (const path of paths) {
      const regexps = Extractor.getRegexps(path);
      if (!regexps.length) continue;
      for (const regexp of regexps) {
        this.regexpsUsedForMatch.add(regexp);
      }
      if (!Extractor.isIgnoredExtraPath(path)) this.extraPathsFound.add(path);
    }
  }

  public get handledPatterns(): string[] {
    const Extractor = this.constructor as typeof BaseExtractor;
    return [
      ...Extractor.definitePatterns,
      ...Extractor.extraAddPatterns,
      ...Extractor.extraChangePatterns,
    ];
  }

  // MATCHED means raw bridge paths that were found in static definitePaths array

  public get definitePathsMatched(): string[] {
    return [].concat(...Object.values(this.definitePathsMap).map(x => Array.from(x)));
  }

  // NOT MATCHED means raw bridge paths that were NOT found in pathsToIgnore AND NOT in static definitePaths array

  public get definitePathsNotMatched(): string[] {
    const Extractor = this.constructor as typeof BaseExtractor;
    return Array.from(this.definitePathsFound).filter(path => {
      if (this.patternsHandledElsewhere.some(x => pathIsPatternMatch(path, x))) return false;
      return !Extractor.definitePatterns.some(x => pathIsPatternMatch(path, x));
    });
  }

  public get definitePathsHandledElsewhere(): string[] {
    return Array.from(this.definitePathsFound).filter(path => {
      return this.patternsHandledElsewhere.some(x => pathIsPatternMatch(path, x));
    });
  }

  public get definitePatternsNotUsed(): string[] {
    const Extractor = this.constructor as typeof BaseExtractor;
    const definitePathsFound = Array.from(this.definitePathsFound);
    return Extractor.definitePatterns.filter(x => {
      return !definitePathsFound.some(path => pathIsPatternMatch(path, x));
    });
  }

  public get extraPathsMatched(): string[] {
    const Extractor = this.constructor as typeof BaseExtractor;

    return Array.from(this.extraPathsFound).filter(path => {
      if (Extractor.definitePatterns.some(x => pathIsPatternMatch(path, x))) return false;
      if (Extractor.extraAddPatterns.some(x => pathIsPatternMatch(path, x))) return true;
      return Extractor.extraChangePatterns.some(x => pathIsPatternMatch(path, x));
    });
  }

  public get extraPathsNotMatched(): string[] {
    const Extractor = this.constructor as typeof BaseExtractor;
    return Array.from(this.extraPathsFound).filter(path => {
      if (Extractor.definitePatterns.some(x => pathIsPatternMatch(path, x))) return false;
      if (this.patternsHandledElsewhere.some(x => pathIsPatternMatch(path, x))) return false;
      if (Extractor.extraAddPatterns.some(x => pathIsPatternMatch(path, x))) return false;
      return !Extractor.extraChangePatterns.some(x => pathIsPatternMatch(path, x));
    });
  }

  public get extraPathsHandledElsewhere(): string[] {
    return Array.from(this.extraPathsFound).filter(path => {
      return this.patternsHandledElsewhere.some(x => pathIsPatternMatch(path, x));
    });
  }

  public get regexpsUsed(): RegExp[] {
    return Array.from(this.regexpsUsedForMatch);
  }

  public setAsHandled(...groupsOfPaths: string[][]): void {
    this.patternsHandledElsewhere = [].concat(...groupsOfPaths);
  }

  public toJSON(): IBridgeDefinitions {
    const Extractor = this.constructor as typeof BaseExtractor;

    const addedPatterns = Array.from(this.definitePathsMap.added).map(path => {
      return Extractor.definitePatterns.find(x => pathIsPatternMatch(path, x));
    });

    const removedPatterns = Array.from(this.definitePathsMap.removed).map(path => {
      return Extractor.definitePatterns.find(x => pathIsPatternMatch(path, x));
    });

    const changedPatterns = Array.from(this.definitePathsMap.changed).map(path => {
      return Extractor.definitePatterns.find(x => pathIsPatternMatch(path, x));
    });

    const changedOrderPatterns = Array.from(this.definitePathsMap.changedOrder).map(path => {
      return Extractor.definitePatterns.find(x => pathIsPatternMatch(path, x));
    });

    const extraAddPatterns = Array.from(this.extraPathsMatched)
      .map(path => {
        return Extractor.extraAddPatterns.find(x => pathIsPatternMatch(path, x));
      })
      .filter(path => path !== undefined);

    const extraChangePatterns = Array.from(this.extraPathsMatched)
      .map(path => {
        return Extractor.extraChangePatterns.find(x => pathIsPatternMatch(path, x));
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

  public getRegexps(path: string): RegExp[] {
    const Extractor = this.constructor as typeof BaseExtractor;
    return Extractor.getRegexps(path);
  }

  // PRIVATE

  private addDefinitePath(path, pathType: IPathType): void {
    this.definitePathsFound.add(path);
    const isDefinitive = (this.constructor as typeof BaseExtractor).isDefinitePath(path);
    if (isDefinitive) {
      this.definitePathsMap[pathType].add(path);
    }
  }

  // PUBLIC STATIC

  public static isDefinitePath(path: string): boolean {
    return this.definitePatterns.some(x => pathIsPatternMatch(path, x));
  }

  public static fitsAnyPattern(path: string): boolean {
    const allPatterns = [
      ...this.definitePatterns,
      ...this.extraAddPatterns,
      ...this.extraChangePatterns,
    ];
    return allPatterns.some(x => pathIsPatternMatch(path, x));
  }

  public static isIgnoredExtraPath(path: string): boolean {
    return this.ignoredExtraPatterns.some(x => pathIsPatternMatch(path, x));
  }

  public static getRegexps(path: string): RegExp[] {
    return this.regexps.filter(x => x.test(path));
  }
}
