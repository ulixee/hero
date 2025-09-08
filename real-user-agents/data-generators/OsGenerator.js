"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const DeviceCategory_1 = require("../interfaces/DeviceCategory");
const OperatingSystems_1 = require("../lib/OperatingSystems");
const OsUtils_1 = require("../lib/OsUtils");
const extractReleaseDateAndDescription_1 = require("../lib/extractReleaseDateAndDescription");
class OsGenerator {
    static async run(data) {
        const byId = {};
        for (const userAgent of data.userAgents) {
            // can't rely on user agent on mac after 10_15_7 (https://chromestatus.com/feature/5452592194781184)
            const id = userAgent.osId;
            const name = (0, OsUtils_1.getOsNameFromId)(id);
            const version = (0, OsUtils_1.getOsVersionFromOsId)(id);
            const marketshare = data.marketshare.byOsId[id] ?? 0;
            if (byId[id])
                continue;
            let releaseDate = 'unknown';
            let description = '';
            try {
                [releaseDate, description] = (0, extractReleaseDateAndDescription_1.default)(id, name, data.osDescriptions, data.osReleaseDates);
            }
            catch (err) {
                console.warn('%s. Update descriptions at "%s" and release dates at "%s"', err.message, `data/manual/osDescriptions.json`, `data/manual/osReleaseDates.json`);
            }
            byId[id] = {
                id,
                name,
                marketshare,
                deviceCategory: DeviceCategory_1.default.desktop,
                version,
                releaseDate,
                description,
            };
        }
        await (0, fileUtils_1.safeOverwriteFile)(OperatingSystems_1.default.filePath, `${JSON.stringify(byId, null, 2)}\n`);
    }
}
exports.default = OsGenerator;
//# sourceMappingURL=OsGenerator.js.map