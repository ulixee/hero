import BaseExtractor from './BaseExtractor';
export default class LocationChangeExtractor extends BaseExtractor {
    static definitePatterns: string[];
    static extraAddPatterns: any[];
    static extraChangePatterns: string[];
    static ignoredExtraPatterns: string[];
    static regexps: RegExp[];
}
