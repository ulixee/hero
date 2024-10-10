import BaseExtractor from './BaseExtractor';
export default class BrowserstackIndicatorExtractor extends BaseExtractor {
    static definitePatterns: string[];
    static extraAddPatterns: any[];
    static extraChangePatterns: any[];
    static ignoredExtraPatterns: any[];
    static regexps: RegExp[];
}
