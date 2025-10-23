"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _DetachedElement_domParser;
Object.defineProperty(exports, "__esModule", { value: true });
const linkedom_1 = require("linkedom");
class DetachedElement {
    static load(outerHTML) {
        return __classPrivateFieldGet(this, _a, "f", _DetachedElement_domParser).parseFromString(outerHTML, 'text/html').firstChild;
    }
}
_a = DetachedElement;
_DetachedElement_domParser = { value: new linkedom_1.DOMParser() };
exports.default = DetachedElement;
//# sourceMappingURL=DetachedElement.js.map