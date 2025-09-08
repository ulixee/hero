"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.existsAsync = existsAsync;
exports.copyDir = copyDir;
exports.readFileAsJson = readFileAsJson;
exports.safeOverwriteFile = safeOverwriteFile;
exports.cleanHomeDir = cleanHomeDir;
const fs_1 = require("fs");
const Os = require("os");
const crypto = require("crypto");
const TypeSerializer_1 = require("./TypeSerializer");
async function existsAsync(path) {
    try {
        await fs_1.promises.access(path);
        return true;
    }
    catch (_) {
        return false;
    }
}
async function copyDir(fromDir, toDir) {
    await fs_1.promises.mkdir(toDir, { recursive: true });
    for (const file of await fs_1.promises.readdir(fromDir, { withFileTypes: true })) {
        const path = `${fromDir}/${file.name}`;
        if (file.isDirectory())
            await copyDir(path, `${toDir}/${file.name}`);
        else
            await fs_1.promises.copyFile(path, `${toDir}/${file.name}`);
    }
}
async function readFileAsJson(path) {
    const buffer = await fs_1.promises.readFile(path, 'utf8').catch(() => null);
    if (!buffer)
        return null;
    return TypeSerializer_1.default.parse(buffer);
}
// Nodejs doesn't guarantee it will complete writing to the file if multiple processes are writing and/or the process shuts down.
async function safeOverwriteFile(path, body) {
    if (await existsAsync(path)) {
        const tempId = crypto.randomBytes(16).toString('hex');
        const tmpPath = `${path}.${tempId}`;
        await fs_1.promises.writeFile(tmpPath, body);
        await fs_1.promises.rename(tmpPath, path);
    }
    else {
        await fs_1.promises.writeFile(path, body);
    }
}
const homeDirReplace = new RegExp(Os.homedir(), 'g');
function cleanHomeDir(str) {
    return str.replace(homeDirReplace, '~');
}
//# sourceMappingURL=fileUtils.js.map