"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIpcSocketPath = createIpcSocketPath;
const os = require("os");
function createIpcSocketPath(name) {
    if (os.platform() === 'win32') {
        return `\\\\.\\pipe\\${name}`;
    }
    return `${os.tmpdir()}/${name}.sock`;
}
//# sourceMappingURL=IpcUtils.js.map