"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updateStatcounterData;
require("@ulixee/commons/lib/SourceMapSupport");
const Fs = require("fs");
const axios_1 = require("axios");
const csvParser = require("csv-parser");
const moment = require("moment");
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const paths_1 = require("../lib/paths");
async function updateStatcounterData() {
    const query = {
        device_hidden: ['desktop'].join('+'),
        region_hidden: 'US',
        granularity: 'monthly',
        'multi-device': true,
        csv: 1,
        fromMonthYear: moment().subtract(1, 'month').format('YYYY-MM'),
        toMonthYear: moment().format('YYYY-MM'),
    };
    const stats = ['os_combined', 'macos_version', 'windows_version', 'browser_version'];
    for (const stat of stats) {
        const filePath = (0, paths_1.getDataFilePath)(`external-raw/statcounter/${stat}.json`);
        const data = await (0, fileUtils_1.readFileAsJson)(filePath);
        if (moment().isSame(moment(data.lastModified), 'month')) {
            console.log(`Data still current for ${stat}`);
            continue;
        }
        const response = await axios_1.default.get('https://gs.statcounter.com/chart.php', {
            params: {
                ...query,
                statType_hidden: stat,
            },
            responseType: 'stream',
        });
        const results = {};
        const updated = await new Promise(resolve => {
            response.data
                .pipe(csvParser())
                .on('data', res => {
                const slot = res.Date === query.fromMonthYear ? 0 : 1;
                for (const [entry, pct] of Object.entries(res)) {
                    if (entry === 'Date')
                        continue;
                    if (!results[entry])
                        results[entry] = ['-1', '-1'];
                    results[entry][slot] = pct;
                }
            })
                .on('end', () => {
                console.log(stat, results);
                resolve({
                    fromMonthYear: query.fromMonthYear,
                    toMonthYear: query.toMonthYear,
                    lastModified: new Date().toISOString(),
                    results,
                });
            });
        });
        await Fs.promises.writeFile(filePath, JSON.stringify(updated, null, 2));
        console.log(`SAVED TO ${filePath}`);
    }
}
//# sourceMappingURL=updateStatcounterData.js.map