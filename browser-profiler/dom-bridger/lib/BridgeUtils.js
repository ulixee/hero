"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDirGroupsMap = extractDirGroupsMap;
exports.pathIsPatternMatch = pathIsPatternMatch;
const Fs = require("fs");
const FOLDER_MATCH = /chrome-(8|9|[1-9][0-9])[0-9]/;
function extractDirGroupsMap(bridge, baseDir) {
    const dirGroupsMap = {};
    for (const source of ['browserstack', 'local']) {
        const dirNames = Fs.readdirSync(`${baseDir}/${source}`).filter(x => x.match(FOLDER_MATCH));
        for (const dirName of dirNames) {
            let [osId, browserId, features] = dirName.split('--'); // eslint-disable-line prefer-const
            const featuresArray = features.replace('selenium', 'devtools').split('-');
            if (bridge.includes(source)) {
                featuresArray.splice(0, 0, source);
            }
            const type = featuresArray.includes(bridge[0]) ? bridge[0] : bridge[1];
            features = featuresArray
                .map(x => (bridge.includes(x) ? `(${bridge.join('|')})` : x))
                .join('-');
            const key = [osId, browserId, features].filter(x => x).join('--');
            dirGroupsMap[key] = dirGroupsMap[key] || {};
            dirGroupsMap[key][type] = `${source}/${dirName}`;
        }
    }
    return dirGroupsMap;
}
function pathIsPatternMatch(path, pattern) {
    if (pattern.charAt(0) === '*') {
        return path.includes(pattern.slice(1));
    }
    // Split twice so we also match otherInvocationAsync, we always use otherInvocation prefix to
    // split or match, so in case we need to encode more data (eg async) we can add it as a suffix.
    const nestedPath = path.split('_$otherInvocation').at(1)?.split('.').slice(1).join('.');
    return path.startsWith(pattern) || nestedPath?.startsWith(pattern);
}
//# sourceMappingURL=BridgeUtils.js.map