"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectedScript = void 0;
const fs = require("fs");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const pageScripts = {
    NodeTracker: fs.readFileSync(`${__dirname}/../injected-scripts/NodeTracker.js`, 'utf8'),
    jsPath: fs.readFileSync(`${__dirname}/../injected-scripts/jsPath.js`, 'utf8'),
    MouseEvents: fs.readFileSync(`${__dirname}/../injected-scripts/MouseEvents.js`, 'utf8'),
    PaintEvents: fs.readFileSync(`${__dirname}/../injected-scripts/PaintEvents.js`, 'utf8'),
};
const pageEventsCallbackName = '__ulxPagePaintEventListenerCallback';
exports.injectedScript = `(function ulxInjectedScripts(callbackName) {
const exports = {}; // workaround for ts adding an exports variable
${TypeSerializer_1.stringifiedTypeSerializerClass};

${pageScripts.NodeTracker};
${pageScripts.jsPath};
${pageScripts.MouseEvents};
${pageScripts.PaintEvents};

window.TypeSerializer = TypeSerializer;
window.ULX = {
  JsPath,
  MouseEvents
};
})('${pageEventsCallbackName}');`.replaceAll(/# sourceMappingURL=.*\.js\.map/g, '');
class InjectedScripts {
    static install(framesManager, devtoolsSession, onPaintEvent) {
        return Promise.all([
            framesManager.addPageCallback(pageEventsCallbackName, (payload, frame) => onPaintEvent(frame.frameId, JSON.parse(payload))),
            framesManager.addNewDocumentScript(exports.injectedScript, framesManager.page.installJsPathIntoIsolatedContext, devtoolsSession),
        ]);
    }
}
InjectedScripts.JsPath = `ULX.JsPath`;
InjectedScripts.MouseEvents = `ULX.MouseEvents`;
exports.default = InjectedScripts;
//# sourceMappingURL=InjectedScripts.js.map