"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const config_1 = require("@double-agent/config");
const COUNTER_START = 18278;
const counterByPrefix = {};
class Probe {
    constructor(id, checkName, checkType, checkMeta, args, pluginId) {
        this.id = id;
        this.checkName = checkName;
        this.checkType = checkType;
        this.checkMeta = checkMeta;
        this.args = args;
        this.pluginId = pluginId;
    }
    get check() {
        if (!this._check) {
            const checksDir = Path.resolve(__dirname, `checks`);
            const pluginChecksDir = Path.resolve(__dirname, `../plugins/${this.pluginId}/lib/checks`);
            let Check;
            try {
                // eslint-disable-next-line global-require,import/no-dynamic-require
                Check = require(`${pluginChecksDir}/${this.checkName}`).default;
            }
            catch (err) {
                // eslint-disable-next-line global-require,import/no-dynamic-require
                Check = require(`${checksDir}/${this.checkName}`).default;
            }
            this._check = new Check({}, this.checkMeta, ...this.args);
        }
        return this._check;
    }
    toJSON() {
        return {
            id: this.id,
            checkName: this.checkName,
            checkType: this.checkType,
            checkMeta: this.checkMeta,
            args: this.args,
        };
    }
    static create(check, pluginId) {
        const id = generateId(check, pluginId);
        return new this(id, check.constructor.name, check.type, check.meta, check.args, pluginId);
    }
    static load(probeObj, pluginId) {
        const { id, checkName, checkType, checkMeta, args } = probeObj;
        return new this(id, checkName, checkType, checkMeta, args, pluginId);
    }
}
exports.default = Probe;
// HELPERS //////
function generateId(check, pluginId) {
    config_1.default.probeIdsMap[pluginId] ??= {};
    let id = config_1.default.probeIdsMap[pluginId][check.signature];
    if (!id) {
        counterByPrefix[check.prefix] ??= COUNTER_START;
        counterByPrefix[check.prefix] += 1;
        id = `${check.prefix}-${convertToAlpha(counterByPrefix[check.prefix])}`.toLowerCase();
    }
    config_1.default.probeIdsMap[pluginId][check.signature] = id;
    return id;
}
function convertToAlpha(num) {
    let t;
    let s = '';
    while (num > 0) {
        t = (num - 1) % 26;
        s = String.fromCharCode(65 + t) + s;
        num = ((num - t) / 26) | 0;
    }
    if (!s) {
        throw new Error(`Integer could not be converted: ${num}`);
    }
    return s;
}
//# sourceMappingURL=Probe.js.map