"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseExtractor_1 = require("./BaseExtractor");
class DevtoolsIndicatorExtractor extends BaseExtractor_1.default {
}
DevtoolsIndicatorExtractor.definitePatterns = [
    'window.Element.prototype.createShadowRoot',
    'window.Document.prototype.registerElement',
    'window.Text.prototype.getDestinationInsertionPoints',
    'window.Element.prototype.getDestinationInsertionPoints',
    'detached.clearStale',
    'detached.isNodeReachable_',
];
DevtoolsIndicatorExtractor.extraAddPatterns = [
    'window.document.$cdc_asdjflasutopfhvcZLmcfl_',
    `*.getDestinationInsertionPoints`,
    'window.cdc_adoQpoasnfa76pfcZLmcfl',
    'window.Element.prototype.createShadowRoot',
];
DevtoolsIndicatorExtractor.extraChangePatterns = [
    'window.document.$cdc_asdjflasutopfhvcZLmcfl_',
    'window.navigator.userActivation',
    'window.navigator.webdriver',
];
DevtoolsIndicatorExtractor.ignoredExtraPatterns = [];
DevtoolsIndicatorExtractor.regexps = [
    /window.navigator.userActivation.+/, // indicates user has done some activity
    /window.find/, // this seems to be returning true on webdriver, but not in a real browser
    /cdc_asdjflasutopfhvcZLmcfl_/,
    /window.cdc_adoQpoasnfa76pfcZLmcfl_/,
    /.getDestinationInsertionPoints/,
    /window.navigator.webdriver.*/,
    /window.Navigator.prototype.webdriver/,
    /window.Element.prototype.createShadowRoot/,
    /window.Document.prototype.registerElement/,
    // TODO: what are these?
    /detached.clearStale/,
    /detached.isNodeReachable_/,
];
exports.default = DevtoolsIndicatorExtractor;
//# sourceMappingURL=DevtoolsIndicatorExtractor.js.map