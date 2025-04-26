"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirname = getDirname;
exports.getSourcedir = getSourcedir;
exports.getClosestPackageJson = getClosestPackageJson;
exports.getDataDirectory = getDataDirectory;
exports.cleanHomeDir = cleanHomeDir;
exports.findProjectPathSync = findProjectPathSync;
exports.findProjectPathAsync = findProjectPathAsync;
const Fs = require("fs");
const os = require("os");
const Path = require("path");
const url_1 = require("url");
const envUtils_1 = require("./envUtils");
const fileUtils_1 = require("./fileUtils");
function getDirname(dirnameOrUrl) {
    if (typeof dirnameOrUrl === 'string') {
        // handle file:// urls like import.meta.url
        if (dirnameOrUrl.startsWith('file://')) {
            const filename = (0, url_1.fileURLToPath)(dirnameOrUrl);
            return Path.dirname(filename);
        }
        return dirnameOrUrl;
    }
    throw new Error('Invalid argument passed to getDirname');
}
function getSourcedir(dirnameOrUrl, buildDir = 'build') {
    const dirname = getDirname(dirnameOrUrl);
    let rootBuildDir = dirname;
    while (!rootBuildDir.endsWith(`${Path.sep}${buildDir}`)) {
        rootBuildDir = Path.dirname(rootBuildDir);
        if (!rootBuildDir || rootBuildDir === Path.sep) {
            return null;
        }
    }
    const relativePath = Path.relative(rootBuildDir, dirname);
    return Path.join(buildDir, '..', relativePath);
}
function getClosestPackageJson(path) {
    while (!Fs.existsSync(Path.join(path, 'package.json'))) {
        const next = Path.dirname(path);
        if (next === path || !next) {
            return null;
        }
        path = next;
    }
    return JSON.parse(Fs.readFileSync(Path.join(path, 'package.json'), 'utf8'));
}
function getDataDirectory() {
    if (process.env.NODE_ENV === 'test' && process.env.ULX_DATA_DIR) {
        const envPath = (0, envUtils_1.parseEnvPath)(process.env.ULX_DATA_DIR);
        if (envPath)
            return envPath;
    }
    if (process.platform === 'linux') {
        return process.env.XDG_DATA_HOME || Path.join(os.homedir(), '.local', 'share');
    }
    if (process.platform === 'darwin') {
        return Path.join(os.homedir(), 'Library', 'Application Support');
    }
    if (process.platform === 'win32') {
        return process.env.LOCALAPPDATA || Path.join(os.homedir(), 'AppData', 'Local');
    }
    throw new Error(`Unsupported platform: ${process.platform}`);
}
const homeDirReplace = new RegExp(os.homedir(), 'g');
function cleanHomeDir(str) {
    return str.replace(homeDirReplace, '~');
}
function findProjectPathSync(startingDirectory) {
    let last;
    let path = Path.resolve(startingDirectory);
    do {
        last = path;
        if (Fs.existsSync(Path.join(path, 'package.json'))) {
            return path;
        }
        path = Path.dirname(path);
    } while (path && path !== last);
    return path;
}
async function findProjectPathAsync(startingDirectory) {
    let last;
    let path = Path.resolve(startingDirectory);
    do {
        last = path;
        if (await (0, fileUtils_1.existsAsync)(Path.join(path, 'package.json'))) {
            return path;
        }
        path = Path.dirname(path);
    } while (path && path !== last);
    return path;
}
//# sourceMappingURL=dirUtils.js.map