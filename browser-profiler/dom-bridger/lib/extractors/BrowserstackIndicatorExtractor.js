"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseExtractor_1 = require("./BaseExtractor");
class BrowserstackIndicatorExtractor extends BaseExtractor_1.default {
}
BrowserstackIndicatorExtractor.definitePatterns = [
    'window.chrome.runtime',
    'window.HTMLAnchorElement.prototype.hrefTranslate',
    'window.GPU.prototype.requestAdapter',
    'window.navigator.gpu.requestAdapter',
];
BrowserstackIndicatorExtractor.extraAddPatterns = ['window.navigator.languages'];
BrowserstackIndicatorExtractor.extraChangePatterns = [
    'window.navigator.languages.length',
    'window.GPU.prototype.requestAdapter',
    'window.navigator.gpu.requestAdapter',
];
BrowserstackIndicatorExtractor.ignoredExtraPatterns = [];
BrowserstackIndicatorExtractor.regexps = [
    /window.chrome$/,
    /window.chrome.runtime/,
    /window.HTMLAnchorElement.prototype.hrefTranslate/,
    /stack._\$value/,
];
exports.default = BrowserstackIndicatorExtractor;
//# sourceMappingURL=BrowserstackIndicatorExtractor.js.map