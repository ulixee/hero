"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setPageDomOverrides;
async function setPageDomOverrides(domOverrides, data, pageOrFrame, devtoolsSession) {
    const script = domOverrides.build('page');
    const callbacks = {};
    for (const { name, fn } of script.callbacks) {
        callbacks[name] = fn;
    }
    // overrides happen in main frame
    await pageOrFrame.addNewDocumentScript(script.script, false, callbacks, devtoolsSession);
}
//# sourceMappingURL=setPageDomOverrides.js.map