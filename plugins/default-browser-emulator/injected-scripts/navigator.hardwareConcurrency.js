"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { replaceGetter } }) {
    replaceGetter(self.navigator, 'hardwareConcurrency', () => args.concurrency, {
        onlyForInstance: true,
    });
}
