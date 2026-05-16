"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
class Browser {
    constructor(browser) {
        const { id, name, marketshare, version, deviceCategory, releaseDate, description } = browser;
        this.id = id;
        this.name = name;
        this.marketshare = marketshare;
        this.version = version;
        this.deviceCategory = deviceCategory;
        this.releaseDate = releaseDate;
        this.description = description;
    }
    get operatingSystemIds() {
        return index_1.default.where({ browserId: this.id }).map(x => x.operatingSystemId);
    }
    static load(browser) {
        return new this(browser);
    }
}
exports.default = Browser;
//# sourceMappingURL=Browser.js.map