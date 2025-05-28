"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const OperatingSystem_1 = require("./OperatingSystem");
const paths_1 = require("./paths");
class OperatingSystems {
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
                this.internalById[id] = OperatingSystem_1.default.load(value);
            }
        }
        return this.internalById;
    }
}
OperatingSystems.filePath = (0, paths_1.getDataFilePath)('operatingSystemsById.json');
exports.default = OperatingSystems;
//# sourceMappingURL=OperatingSystems.js.map