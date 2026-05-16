import BaseExtractor from './BaseExtractor';
export default class HeadlessIndicatorExtractor extends BaseExtractor {
    static definitePatterns: string[];
    static extraAddPatterns: any[];
    static extraChangePatterns: any[];
    static ignoredExtraPatterns: any[];
    static regexps: RegExp[];
}
