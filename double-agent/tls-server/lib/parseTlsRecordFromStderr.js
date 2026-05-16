"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseTlsRecordFromStderr;
const parseHelloMessage_1 = require("./parseHelloMessage");
function parseTlsRecordFromStderr(str) {
    const lines = str.split('\n');
    const record = {
        header: {},
    };
    const type = lines.shift();
    if (type === 'Sent Record')
        record.header.from = 'server';
    else if (type === 'Received Record')
        record.header.from = 'client';
    while (lines.length) {
        const line = lines.shift();
        if (line.includes('Header:'))
            continue;
        if (line.includes('--details--')) {
            record.details = lines.join('\n');
            break;
        }
        const match = line.match(/^(\s+)/);
        const lineIndent = match ? match[1].length : 0;
        if (lineIndent === 2) {
            if (line.includes('Version')) {
                record.header.version = line.replace('Version = ', '').trim();
            }
            if (line.includes('Content Type')) {
                record.header.contentType = line.replace('Content Type = ', '').trim();
            }
            if (line.includes('Length')) {
                record.header.length = line.replace('Length = ', '').trim();
            }
        }
        // body type
        else if (lineIndent === 4) {
            record.header.content = {};
            if (line.includes('ClientHello')) {
                record.header.content = (0, parseHelloMessage_1.default)(true, lines);
                break;
            }
            else if (line.includes('ServerHello')) {
                record.header.content = (0, parseHelloMessage_1.default)(false, lines);
                break;
            }
            else {
                record.header.content = (line.substr(lineIndent) +
                    lines.map((x) => x.substr(lineIndent)).join('\n'));
                break;
            }
        }
    }
    return record;
}
//# sourceMappingURL=parseTlsRecordFromStderr.js.map