import BaseExtractor from './BaseExtractor';
export default class WindowChangeExtractor extends BaseExtractor {
    static definitePatterns: any[];
    static extraAddPatterns: any[];
    static extraChangePatterns: string[];
    static ignoredExtraPatterns: string[];
    static regexps: RegExp[];
}
