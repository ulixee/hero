"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRawHeaders = parseRawHeaders;
exports.toLowerCase = toLowerCase;
function parseRawHeaders(rawHeaders) {
    const headers = {};
    for (let i = 0; i < rawHeaders.length; i += 2) {
        const key = rawHeaders[i];
        const value = rawHeaders[i + 1];
        if (headers[key] || toLowerCase(key) === 'set-cookie') {
            if (Array.isArray(headers[key])) {
                headers[key].push(value);
            }
            else if (headers[key]) {
                headers[key] = [headers[key], value];
            }
            else {
                headers[key] = [value];
            }
        }
        else {
            headers[key] = value;
        }
    }
    return headers;
}
const lowerCaseMap = {};
function toLowerCase(header) {
    lowerCaseMap[header] ??= header.toLowerCase();
    return lowerCaseMap[header];
}
//# sourceMappingURL=Utils.js.map