"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { replaceGetter } }) {
    replaceGetter(window.screen, 'availHeight', () => window.screen.height - (args.unAvailHeight ?? 0), { onlyForInstance: true });
    replaceGetter(window.screen, 'availWidth', () => window.screen.width - (args.unAvailWidth ?? 0), {
        onlyForInstance: true,
    });
    const colorDepth = args.colorDepth;
    if (colorDepth) {
        replaceGetter(window.screen, 'colorDepth', () => colorDepth, { onlyForInstance: true });
        replaceGetter(window.screen, 'pixelDepth', () => colorDepth, { onlyForInstance: true });
    }
}
