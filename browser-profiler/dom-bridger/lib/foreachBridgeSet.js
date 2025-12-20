"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = foreachBridgeSet;
const Fs = require("fs");
const Path = require("path");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const zlib_1 = require("zlib");
const BridgeUtils_1 = require("./BridgeUtils");
const baseDomsDir = Path.resolve(unblocked_browser_profiler_1.default.dataDir, 'profiled-doms');
function foreachBridgeSet(protocol, bridge, runFn) {
    const dirGroupsMap = (0, BridgeUtils_1.extractDirGroupsMap)(bridge, baseDomsDir);
    for (const key of Object.keys(dirGroupsMap)) {
        const fileNamesBySource = dirGroupsMap[key];
        if (bridge[0] !== bridge[1] && Object.keys(fileNamesBySource).length !== 2) {
            console.log('CORRUPTED: ', key, Object.keys(fileNamesBySource));
            delete dirGroupsMap[key];
        }
    }
    for (const key of Object.keys(dirGroupsMap)) {
        const dirName1 = dirGroupsMap[key][bridge[0]];
        const dirName2 = dirGroupsMap[key][bridge[1]];
        const fileName1 = `browser-dom-environment--${protocol}--1.json.gz`;
        const fileName2 = `browser-dom-environment--${protocol}--${bridge[0] === bridge[1] ? '2' : '1'}.json.gz`;
        const domDir1 = Path.join(baseDomsDir, dirName1);
        const domDir2 = Path.join(baseDomsDir, dirName2);
        try {
            const { data: dom1 } = JSON.parse((0, zlib_1.gunzipSync)(Fs.readFileSync(`${domDir1}/${fileName1}`)).toString());
            const { data: dom2 } = JSON.parse((0, zlib_1.gunzipSync)(Fs.readFileSync(`${domDir2}/${fileName2}`)).toString());
            const fileName = bridge[0] === bridge[1] ? fileName1.replace('--1.json.gz', '--(1|2).json') : fileName1;
            const fileKey = `${key}/${fileName}`;
            runFn(fileKey, dom1, dom2);
        }
        catch (err) {
            console.log('couldn\t read file', err, { domDir1, domDir2 });
        }
    }
}
//# sourceMappingURL=foreachBridgeSet.js.map