"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OperatingSystem {
    constructor(id, name, marketshare, version, deviceCategory, releaseDate, description) {
        this.id = id;
        this.name = name;
        this.marketshare = marketshare;
        this.version = version;
        this.deviceCategory = deviceCategory;
        this.releaseDate = releaseDate;
        this.description = description;
    }
    static load(object) {
        const { id, name, marketshare, version, deviceCategory, releaseDate, description } = object;
        return new this(id, name, marketshare, version, deviceCategory, releaseDate, description);
    }
}
exports.default = OperatingSystem;
//# sourceMappingURL=OperatingSystem.js.map