"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BrowserLaunchError extends Error {
    constructor(message, stack, isSandboxError = false) {
        super(message);
        this.isSandboxError = isSandboxError;
        stack ??= this.stack;
        if (stack.startsWith('Error: '))
            stack = stack.substring('Error: '.length);
        this.stack = stack;
        this.name = 'BrowserLaunchError';
        if (message.includes('Missing X server'))
            stack += [
                '',
                '=====================================================================================',
                '=====================================================================================',
                '=====================================================================================',
                '\nLooks like you launched Headed Chrome without an XServer running.',
                '================================',
                'To workaround Linux XServer issues, do either of the following:',
                '  - Use headless (showChrome: false) ',
                "  - Use 'xvfb-run <your script>'",
                `================================`,
                ``,
            ].join('\n');
        // These error messages are taken from Chromium source code as of July, 2020:
        // https://github.com/chromium/chromium/blob/70565f67e79f79e17663ad1337dc6e63ee207ce9/content/browser/zygote_host/zygote_host_impl_linux.cc
        else if (message.includes('crbug.com/357670') ||
            message.includes('No usable sandbox!') ||
            message.includes('crbug.com/638180')) {
            stack += [
                '',
                '=====================================================================================',
                '=====================================================================================',
                '=====================================================================================',
                `\nChrome sandboxing failed!`,
                `================================`,
                `To workaround sandboxing issues, do either of the following:`,
                `  - (preferred): Configure environment to support sandboxing (as here: https://github.com/ulixee/ulixee/tree/main/tools/docker)`,
                `  - (alternative): Launch Chrome without sandbox using 'ULX_NO_CHROME_SANDBOX=false' environmental variable`,
                `================================`,
                ``,
            ].join('\n');
            this.isSandboxError = true;
        }
        this.stack = `${this.name}:\n${stack}`;
    }
}
exports.default = BrowserLaunchError;
//# sourceMappingURL=BrowserLaunchError.js.map