"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Dialog_coreTab;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDialog = createDialog;
class Dialog {
    constructor(coreTab, data) {
        _Dialog_coreTab.set(this, void 0);
        __classPrivateFieldSet(this, _Dialog_coreTab, coreTab, "f");
        this.url = data.url;
        this.message = data.message;
        this.type = data.type;
        this.hasBrowserHandler = data.hasBrowserHandler;
        this.defaultPrompt = data.defaultPrompt;
    }
    async dismiss(accept, promptText) {
        const coreTab = await __classPrivateFieldGet(this, _Dialog_coreTab, "f");
        return coreTab.dismissDialog(accept, promptText);
    }
}
_Dialog_coreTab = new WeakMap();
exports.default = Dialog;
function createDialog(coreTab, data) {
    return new Dialog(coreTab, data);
}
//# sourceMappingURL=Dialog.js.map