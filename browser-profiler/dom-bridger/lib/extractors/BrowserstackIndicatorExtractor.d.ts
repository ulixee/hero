import BaseExtractor from './BaseExtractor';
export default class BrowserstackIndicatorExtractor extends BaseExtractor {
    static definitePatterns: string[];
    static extraAddPatterns: string[];
    static extraChangePatterns: string[];
    static ignoredExtraPatterns: any[];
    static regexps: RegExp[];
}
