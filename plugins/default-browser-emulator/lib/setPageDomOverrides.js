"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setPageDomOverrides;
async function setPageDomOverrides(domOverrides, data, pageOrFrame, devtoolsSession) {
    const script = domOverrides.build('page');
    const promises = [];
    for (const { name, fn } of script.callbacks) {
        promises.push(pageOrFrame.addPageCallback(name, fn));
    }
    // overrides happen in main frame
    promises.push(pageOrFrame.addNewDocumentScript(script.script, false, devtoolsSession));
    await Promise.all(promises);
}
//# sourceMappingURL=setPageDomOverrides.js.map