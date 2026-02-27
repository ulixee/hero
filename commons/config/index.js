"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
const dirUtils_1 = require("../lib/dirUtils");
const fileUtils_1 = require("../lib/fileUtils");
const Callsite_1 = require("../lib/Callsite");
class UlixeeConfig {
    static get global() {
        this.globalConfig ??= new UlixeeConfig(this.globalConfigDirectory);
        return this.globalConfig;
    }
    get configPath() {
        return Path.join(this.directoryPath, 'config.json');
    }
    constructor(directoryPath) {
        this.directoryPath = directoryPath;
        if (Fs.existsSync(this.configPath)) {
            const data = JSON.parse(Fs.readFileSync(this.configPath, 'utf8'));
            if (data.datastoreOutDir) {
                this.datastoreOutDir = Path.isAbsolute(data.datastoreOutDir)
                    ? data.datastoreOutDir
                    : Path.resolve(this.directoryPath, data.datastoreOutDir);
            }
        }
    }
    save() {
        return (0, fileUtils_1.safeOverwriteFile)(this.configPath, JSON.stringify(this.getData(), null, 2));
    }
    getData() {
        return {
            datastoreOutDir: this.datastoreOutDir,
        };
    }
    static load(runtimeLocation) {
        runtimeLocation = this.useRuntimeLocationDefaults(runtimeLocation);
        const key = this.getLocationKey(runtimeLocation);
        if (!this.cachedConfigObjects[key]) {
            const directory = this.findConfigDirectory(runtimeLocation);
            if (directory === this.globalConfigDirectory)
                return UlixeeConfig.global;
            const config = new UlixeeConfig(directory);
            if (this.isCacheEnabled)
                this.cachedConfigObjects[key] = config;
            return config;
        }
        return this.cachedConfigObjects[key];
    }
    static findConfigDirectory(runtimeLocation, defaultToGlobal = true) {
        runtimeLocation = this.useRuntimeLocationDefaults(runtimeLocation);
        const key = this.getLocationKey(runtimeLocation);
        if (!this.cachedConfigLocations[key]) {
            const configDirectory = this.traverseDirectories(runtimeLocation, defaultToGlobal);
            if (this.isCacheEnabled)
                this.cachedConfigLocations[key] = configDirectory;
            return configDirectory;
        }
        return this.cachedConfigLocations[key];
    }
    static useRuntimeLocationDefaults(runtimeLocation) {
        return {
            entrypoint: runtimeLocation?.entrypoint ?? Callsite_1.default.getEntrypoint(),
            workingDirectory: runtimeLocation?.workingDirectory ?? process.cwd(),
        };
    }
    static getLocationKey(runtimeLocation) {
        return `${runtimeLocation.workingDirectory}_${runtimeLocation.entrypoint}`;
    }
    static traverseDirectories(runtimeLocation, defaultToGlobal) {
        const { entrypoint, workingDirectory } = runtimeLocation;
        // look up hierarchy from the entrypoint of the script
        let currentPath = Path.dirname(entrypoint);
        do {
            const upDirectory = Path.dirname(currentPath);
            if (upDirectory === currentPath)
                break;
            currentPath = upDirectory;
            const configPath = this.hasConfigDirectory(currentPath);
            if (configPath)
                return configPath;
        } while (currentPath.length && Fs.existsSync(currentPath));
        const configPath = this.hasConfigDirectory(workingDirectory);
        if (configPath)
            return configPath;
        if (!defaultToGlobal)
            return null;
        // global directory is the working directory
        return this.globalConfigDirectory;
    }
    static hasConfigDirectory(path) {
        const pathToCheck = Path.normalize(Path.join(path, this.configDirectoryName));
        if (Fs.existsSync(pathToCheck) && Fs.statSync(pathToCheck).isDirectory())
            return pathToCheck;
    }
}
UlixeeConfig.isCacheEnabled = process.env.NODE_END === 'production';
UlixeeConfig.globalConfigDirectory = Path.join((0, dirUtils_1.getDataDirectory)(), 'ulixee');
UlixeeConfig.configDirectoryName = '.ulixee';
UlixeeConfig.cachedConfigLocations = {};
UlixeeConfig.cachedConfigObjects = {};
exports.default = UlixeeConfig;
//# sourceMappingURL=index.js.map