"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const humanize_string_1 = require("humanize-string");
const initialism_1 = require("initialism");
const slugify_1 = require("slugify");
class Layer {
    constructor(id, key, name, pluginId) {
        this.id = id;
        this.key = key;
        this.name = name;
        this.pluginId = pluginId;
    }
    static extractKeyFromProbeMeta(meta) {
        let key = meta.layerKey;
        if (!key) {
            const title = (0, humanize_string_1.default)(meta.layerName);
            const words = title.split(' ');
            key =
                words.length === 2 ? (0, initialism_1.default)(words[0], 2) + (0, initialism_1.default)(words[1]) : (0, initialism_1.default)(title, 3);
        }
        return key.toLowerCase();
    }
    static create(key, name, pluginId) {
        const id = (0, slugify_1.default)(name, '-').toLowerCase();
        return new this(id, key, name, pluginId);
    }
    static load(obj) {
        const { id, key, name, pluginId } = obj;
        return new this(id, key, name, pluginId);
    }
}
exports.default = Layer;
//# sourceMappingURL=Layer.js.map