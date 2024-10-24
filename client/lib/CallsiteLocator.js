"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Callsite_1 = require("@ulixee/commons/lib/Callsite");
const Path = require("path");
const AwaitedDomPath = require
    .resolve('@ulixee/awaited-dom/package.json')
    .replace('package.json', '');
const HeroLibPath = require.resolve('./Hero').replace(/\/Hero\.(?:ts|js)/, '');
class CallsiteLocator {
    constructor(entrypoint = Callsite_1.default.getEntrypoint()) {
        this.entrypoint = entrypoint;
    }
    getCurrent() {
        const stack = Callsite_1.default.getSourceCodeLocation(module.filename);
        let stackLines = [];
        let lastIndexOfEntrypoint = -1;
        for (const callsite of stack) {
            const { filename } = callsite;
            if (!filename)
                continue;
            if (CallsiteLocator.ignoreModulePaths.some(x => filename.startsWith(x))) {
                continue;
            }
            if (CallsiteLocator.ignoreModulePathFragments.some(x => filename.includes(x))) {
                continue;
            }
            if (filename.endsWith(this.entrypoint)) {
                lastIndexOfEntrypoint = stackLines.length;
            }
            stackLines.push(callsite);
        }
        if (lastIndexOfEntrypoint >= 0)
            stackLines = stackLines.slice(0, lastIndexOfEntrypoint + 1);
        return stackLines;
    }
}
CallsiteLocator.ignoreModulePaths = ['node:internal', AwaitedDomPath, HeroLibPath];
CallsiteLocator.ignoreModulePathFragments = [`${Path.sep}node_modules`];
exports.default = CallsiteLocator;
//# sourceMappingURL=CallsiteLocator.js.map