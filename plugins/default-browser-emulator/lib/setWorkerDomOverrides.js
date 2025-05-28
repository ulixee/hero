"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setWorkerDomOverrides;
function setWorkerDomOverrides(domOverrides, data, worker) {
    const scriptNames = domOverrides.getWorkerOverrides();
    const script = domOverrides.build(worker.type, scriptNames);
    if (script.callbacks.length) {
        throw new Error("Workers can't create callbacks");
    }
    return worker.evaluate(script.script, true);
}
//# sourceMappingURL=setWorkerDomOverrides.js.map