"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _UlixeeHostsConfig_watchHandle;
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
const dirUtils_1 = require("../lib/dirUtils");
const VersionUtils_1 = require("../lib/VersionUtils");
const utils_1 = require("../lib/utils");
const eventUtils_1 = require("../lib/eventUtils");
class UlixeeHostsConfig extends eventUtils_1.TypedEventEmitter {
    static get global() {
        return new UlixeeHostsConfig(Path.join((0, dirUtils_1.getDataDirectory)(), 'ulixee'));
    }
    get configPath() {
        return Path.join(this.directoryPath, 'hosts');
    }
    constructor(directoryPath) {
        super();
        this.directoryPath = directoryPath;
        this.hostByVersion = {};
        _UlixeeHostsConfig_watchHandle.set(this, void 0);
        if (!Fs.existsSync(this.configPath)) {
            Fs.mkdirSync(this.configPath, { recursive: true });
        }
        // not supported on linux!
        this.onEventListenerAdded = event => {
            if (event !== 'change')
                return;
            if (process.platform === 'win32' || process.platform === 'darwin') {
                __classPrivateFieldSet(this, _UlixeeHostsConfig_watchHandle, Fs.watch(this.configPath, { recursive: true, persistent: false }, this.reload.bind(this, true)), "f");
            }
            else {
                Fs.watchFile(this.configPath, { persistent: false }, this.reload.bind(this, true));
            }
        };
        this.reload();
    }
    setVersionHost(version, host) {
        if (!host) {
            delete this.hostByVersion[version];
        }
        else {
            let cloudModulePath;
            try {
                cloudModulePath = require.resolve('@ulixee/cloud');
            }
            catch (err) {
                /* no-op */
            }
            this.hostByVersion[version] = {
                host,
                nodePath: process.execPath,
                cloudModulePath,
            };
        }
        this.save(version);
    }
    hasHosts() {
        return Object.keys(this.hostByVersion).length > 0;
    }
    getVersionHost(version) {
        if (this.hostByVersion[version])
            return this.hostByVersion[version].host;
        for (const [hostVersion, info] of Object.entries(this.hostByVersion)) {
            if ((0, VersionUtils_1.isSemverSatisfied)(version, hostVersion)) {
                return info.host;
            }
        }
        return null;
    }
    async checkLocalVersionHost(version, host) {
        if (!host?.startsWith('localhost'))
            return host;
        if (host?.startsWith('localhost')) {
            if (!(await (0, utils_1.isPortInUse)(host.split(':').pop()))) {
                this.setVersionHost(version, null);
                return null;
            }
        }
        return host;
    }
    reload(checkForChange = false) {
        const prev = checkForChange ? JSON.stringify(this.hostByVersion) : '';
        this.hostByVersion = {};
        for (const file of Fs.readdirSync(this.configPath)) {
            if (file.endsWith('.json')) {
                const versionPath = Path.join(this.configPath, file);
                const version = file.replace('.json', '');
                try {
                    this.hostByVersion[version] = JSON.parse(Fs.readFileSync(versionPath, 'utf8'));
                }
                catch { }
            }
        }
        if (checkForChange && prev !== JSON.stringify(this.hostByVersion)) {
            this.emit('change');
        }
    }
    save(version) {
        const versionPath = Path.join(this.configPath, `${version}.json`);
        const host = this.hostByVersion[version];
        if (!host) {
            try {
                Fs.unlinkSync(versionPath);
            }
            catch (err) { }
        }
        else {
            Fs.writeFileSync(versionPath, JSON.stringify(host));
        }
    }
}
_UlixeeHostsConfig_watchHandle = new WeakMap();
exports.default = UlixeeHostsConfig;
//# sourceMappingURL=hosts.js.map