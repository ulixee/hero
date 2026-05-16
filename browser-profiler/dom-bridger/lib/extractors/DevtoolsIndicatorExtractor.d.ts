import BaseExtractor from './BaseExtractor';
export default class DevtoolsIndicatorExtractor extends BaseExtractor {
    static definitePatterns: string[];
    static extraAddPatterns: string[];
    static extraChangePatterns: string[];
    static ignoredExtraPatterns: any[];
    static regexps: RegExp[];
}
