"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// LOAD DATA
const fs_1 = require("fs");
const Browser_1 = require("./Browser");
const paths_1 = require("./paths");
class Browsers {
    static all() {
        return Object.values(this.getById());
    }
    static byId(id) {
        return this.getById()[id];
    }
    static getById() {
        if (!this.internalById) {
            this.internalById = JSON.parse((0, fs_1.readFileSync)(this.filePath, 'utf8'));
            for (const [id, value] of Object.entries(this.internalById)) {
                this.internalById[id] = Browser_1.default.load(value);
            }
        }
        return this.internalById;
    }
}
Browsers.filePath = (0, paths_1.getDataFilePath)('browsersById.json');
exports.default = Browsers;
//# sourceMappingURL=Browsers.js.map