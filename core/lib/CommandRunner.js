"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionClosedOrMissingError_1 = require("@ulixee/commons/lib/SessionClosedOrMissingError");
class CommandRunner {
    constructor(command, args, targets) {
        this.shouldRecord = true;
        const [targetName, method] = command.split('.');
        if (!targets[targetName]) {
            if (method === 'close' || (targetName === 'Events' && method === 'removeEventListener')) {
                this.runFn = () => Promise.resolve({});
                return;
            }
            throw new Error(`Target for command not available (${targetName}:${method})`);
        }
        if (!targets[targetName].isAllowedCommand(method)) {
            throw new Error(`Command not allowed (${command}) on ${targetName}`);
        }
        const target = targets[targetName];
        if (!target) {
            throw new SessionClosedOrMissingError_1.default(`The requested command (${command}) references a ${targetName[0].toLowerCase() + targetName.slice(1)} that is closed or invalid.`);
        }
        this.runFn = async () => {
            if (!this.shouldRecord) {
                return await target[`___${method}`](...args);
            }
            return await target[method](...args);
        };
    }
}
exports.default = CommandRunner;
//# sourceMappingURL=CommandRunner.js.map