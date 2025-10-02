"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseExtractor_1 = require("./BaseExtractor");
class HeadlessIndicatorExtractor extends BaseExtractor_1.default {
}
HeadlessIndicatorExtractor.definitePatterns = ['window.HTMLLinkElement.prototype.import'];
HeadlessIndicatorExtractor.extraAddPatterns = [];
HeadlessIndicatorExtractor.extraChangePatterns = [];
HeadlessIndicatorExtractor.ignoredExtraPatterns = [];
HeadlessIndicatorExtractor.regexps = [/window.HTMLLinkElement.prototype.import/];
exports.default = HeadlessIndicatorExtractor;
//# sourceMappingURL=HeadlessIndicatorExtractor.js.map