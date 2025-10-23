"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const DeviceCategory_1 = require("../interfaces/DeviceCategory");
const Browsers_1 = require("../lib/Browsers");
const BrowserUtils_1 = require("../lib/BrowserUtils");
const extractReleaseDateAndDescription_1 = require("../lib/extractReleaseDateAndDescription");
const extractUserAgentMeta_1 = require("../lib/extractUserAgentMeta");
class BrowserGenerator {
    static async run(data) {
        const byId = {};
        for (const { string: userAgentString } of data.userAgents) {
            const { name, version } = (0, extractUserAgentMeta_1.default)(userAgentString);
            const browserId = (0, BrowserUtils_1.createBrowserId)({ name, version });
            const marketshare = data.marketshare.byBrowserId[browserId] ?? 0;
            let releaseDate = 'unknown';
            let description = '';
            try {
                [releaseDate, description] = (0, extractReleaseDateAndDescription_1.default)(browserId, name, data.browserDescriptions, data.browserReleaseDates);
            }
            catch (err) {
                console.warn('%s. Update descriptions at "%s" and release dates at "%s"', err.message, `data/manual/browserDescriptions.json`, `data/manual/browserReleaseDates.json`);
            }
            byId[browserId] = {
                id: browserId,
                name,
                marketshare,
                version,
                deviceCategory: DeviceCategory_1.default.desktop,
                releaseDate,
                description,
            };
        }
        const browserEnginesData = JSON.stringify(byId, null, 2);
        await Fs.promises.writeFile(Browsers_1.default.filePath, `${browserEnginesData}\n`);
    }
}
exports.default = BrowserGenerator;
//# sourceMappingURL=BrowserGenerator.js.map