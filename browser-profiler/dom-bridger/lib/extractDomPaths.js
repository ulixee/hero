"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPathsFromDom = extractPathsFromDom;
function extractPathsFromDom(dom, basePath = '', paths = []) {
    let hasChildren = false;
    for (const key of Object.keys(dom)) {
        const path = basePath ? `${basePath}.${key}` : key;
        const value = dom[key];
        if (typeof value === 'object' && !key.startsWith('_$')) {
            paths = extractPathsFromDom(value, path, paths);
            hasChildren = true;
        }
        else {
            paths.push(path);
        }
    }
    if (!hasChildren) {
        paths.push(basePath);
    }
    return paths;
}
//# sourceMappingURL=extractDomPaths.js.map