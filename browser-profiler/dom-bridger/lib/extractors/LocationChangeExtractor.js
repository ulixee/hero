"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseExtractor_1 = require("./BaseExtractor");
class LocationChangeExtractor extends BaseExtractor_1.default {
}
LocationChangeExtractor.definitePatterns = [
    'window.location.search',
    'window.document.title',
    'window.history.length',
    'window.document.location.search',
];
LocationChangeExtractor.extraAddPatterns = [];
LocationChangeExtractor.extraChangePatterns = [
    'window.location.href',
    'window.location.ancestorOrigins',
    'window.location.origin',
    'window.location.protocol',
    'window.location.host',
    'window.location.hostname',
    'window.location.port',
    'window.location.pathname',
    'window.location.hash',
    'window.document.location',
    'window.document.domain',
    'window.document.referrer',
    'window.location.fragmentDirective',
    'window.document.URL',
    'window.document.baseURI',
    'window.document.documentElement.baseURI',
    'window.document.documentElement.namespaceURI',
    'window.document.documentURI',
    'window.Document.new().domain',
];
LocationChangeExtractor.ignoredExtraPatterns = [
    'window.decodeURI.length',
    'window.decodeURI.name',
    'window.decodeURIComponent.length',
    'window.decodeURIComponent.name',
    'window.encodeURI.length',
    'window.encodeURI.name',
    'window.encodeURIComponent.length',
    'window.encodeURIComponent.name',
    'window.document.documentElement.style.webkitTextSecurity',
    'window.document.onsecuritypolicyviolation',
    'window.webkitSpeechGrammarList.prototype.addFromUri.length',
    'window.webkitSpeechGrammarList.prototype.addFromUri.name',
    'window.webkitSpeechRecognitionError.prototype.CAPTURING_PHASE',
    'window.webkitSpeechRecognitionError.CAPTURING_PHASE',
    'window.webkitSpeechRecognitionEvent.prototype.CAPTURING_PHASE',
    'window.webkitSpeechRecognitionEvent.CAPTURING_PHASE',
    'window.Location.length',
    'window.Location.name',
    'window.Location.arguments',
    'window.Location.caller',
    'window.Location.prototype.Symbol(Symbol.toStringTag)',
    'window.Location.new()',
    'window.webkitURL',
    'window.location.assign',
    'window.location.reload',
    'window.location.toString',
    'window.location.valueOf',
    'window.location.replace',
    'window.location.Symbol(Symbol.toPrimitive)',
    'window.webkitResolveLocalFileSystemURL.length',
    'window.webkitResolveLocalFileSystemURL.name',
    'window.Location.prototype.fragmentDirective',
    'window.webkitURL.length',
    'window.webkitURL.name',
    'window.webkitURL.arguments',
    'window.webkitURL.caller',
    'window.webkitURL.prototype.origin',
    'window.webkitURL.prototype.protocol',
    'window.webkitURL.prototype.username',
    'window.webkitURL.prototype.password',
    'window.webkitURL.prototype.host',
    'window.webkitURL.prototype.hostname',
    'window.webkitURL.prototype.port',
    'window.webkitURL.prototype.pathname',
    'window.webkitURL.prototype.search',
    'window.webkitURL.prototype.searchParams',
    'window.webkitURL.prototype.hash',
    'window.webkitURL.prototype.href',
    'window.webkitURL.prototype.toJSON.length',
    'window.webkitURL.prototype.toJSON.name',
    'window.webkitURL.prototype.toString.length',
    'window.webkitURL.prototype.toString.name',
    'window.webkitURL.prototype.Symbol(Symbol.toStringTag)',
    'window.webkitURL.createObjectURL.length',
    'window.webkitURL.createObjectURL.name',
    'window.webkitURL.revokeObjectURL.length',
    'window.webkitURL.revokeObjectURL.name',
    'window.webkitURL.new()',
    'window.decodeURI',
    'window.encodeURI',
];
LocationChangeExtractor.regexps = [
    /window\.[a-z].+(U|u)(ri|RI)/,
    /window\.[a-z].+(U|u)(rl|RL)/,
    /window\.[a-z].+(H|h)ref/,
    /location.port/,
    /window\.[a-z].+(R|r)eferrer/,
    /window\.[a-z].+(D|d)omain/,
    /window.Document.new\(\).domain/,
    /window.location.+/,
    /window.document.location/,
    /window.document.title/,
];
exports.default = LocationChangeExtractor;
//# sourceMappingURL=LocationChangeExtractor.js.map