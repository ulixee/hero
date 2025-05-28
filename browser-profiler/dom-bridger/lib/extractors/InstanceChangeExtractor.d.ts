import BaseExtractor from './BaseExtractor';
export default class InstanceChangeExtractor extends BaseExtractor {
    static definitePatterns: string[];
    static extraAddPatterns: any[];
    static extraChangePatterns: string[];
    static ignoredExtraPatterns: any[];
    static regexps: RegExp[];
}
