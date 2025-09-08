"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const readline = require("readline");
class CoreKeepAlivePrompt {
    constructor(message, onQuit) {
        this.onQuit = onQuit;
        this.close = this.close.bind(this);
        if (/yes|1|true/i.test(process.env.ULX_CLI_NOPROMPT))
            return;
        this.message = `\n\n${message}\n\nPress Q or kill the CLI to exit and close Chrome:\n\n`;
        this.cliPrompt = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setEncoding('utf8');
        if (process.stdin.isTTY)
            process.stdin.setRawMode(true);
        this.cliPrompt.setPrompt(this.message);
        process.stdin.on('keypress', async (chunk, key) => {
            if (key.name?.toLowerCase() === 'q' ||
                (key.name?.toLowerCase() === 'c' && key.ctrl === true)) {
                try {
                    await this.onQuit();
                }
                catch (error) {
                    if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                        return;
                    throw error;
                }
            }
        });
        ShutdownHandler_1.default.register(this.close);
        this.cliPrompt.prompt(true);
    }
    close() {
        ShutdownHandler_1.default.unregister(this.close);
        if (this.cliPrompt) {
            this.cliPrompt.close();
            this.cliPrompt = null;
        }
    }
}
exports.default = CoreKeepAlivePrompt;
//# sourceMappingURL=CoreKeepAlivePrompt.js.map