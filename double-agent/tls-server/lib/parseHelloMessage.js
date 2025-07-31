"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.greaseCodes = void 0;
exports.default = parseHelloMessage;
const extensions = require("../spec/extensions.json");
function parseHelloMessage(isClientHello, lines) {
    const message = isClientHello
        ? { type: 'ClientHello' }
        : { type: 'ServerHello' };
    let prop = null;
    for (const line of lines) {
        // starts with 6 spaces
        const helloLine = line.substr(6);
        if (helloLine.startsWith('client_version')) {
            message.version = helloLine.split('client_version=').pop();
        }
        else if (helloLine.startsWith('server_version')) {
            message.version = helloLine.split('server_version=').pop();
        }
        else if (helloLine.startsWith('Random')) {
            prop = 'random';
            message.random = {};
        }
        else if (helloLine.startsWith('session_id')) {
            message.sessionId = helloLine.split(':').pop().trim();
        }
        else if (helloLine.startsWith('cipher_suites')) {
            message.ciphers = [];
            prop = 'ciphers';
        }
        else if (helloLine.startsWith('compression_methods')) {
            prop = 'compressionMethods';
            message.compressionMethods = [];
        }
        else if (helloLine.startsWith('cipher_suite ')) {
            prop = 'cipher';
        }
        else if (helloLine.startsWith('compression_method:')) {
            prop = 'compressionMethod';
        }
        else if (helloLine.startsWith('extensions, ')) {
            prop = 'extensions';
            message.extensions = [];
        }
        else if (prop === 'random') {
            if (helloLine.includes('gmt_unix_time')) {
                message.random.unixTime = helloLine.split('gmt_unix_time=').pop();
            }
            if (helloLine.includes('random_bytes')) {
                message.random.randomBytes = helloLine.split(': ').pop();
            }
        }
        else if (prop === 'ciphers') {
            message.ciphers.push(helloLine.trim());
        }
        else if (prop === 'compressionMethods') {
            message.compressionMethods.push(helloLine.trim());
        }
        else if (prop === 'cipher') {
            message.cipher = helloLine.split('} ').pop();
        }
        else if (prop === 'compressionMethod') {
            message.compressionMethod = helloLine.split('} ').pop();
        }
        else if (prop === 'extensions') {
            if (helloLine.includes('extension_type=')) {
                message.extensions.push({
                    type: helloLine.split('extension_type=').pop().split('(').shift().trim(),
                    decimal: Number(helloLine.split('extension_type=').pop().split('(').pop().split(')').shift().trim()),
                    values: [],
                });
            }
            else {
                message.extensions[message.extensions.length - 1].values.push(helloLine.trim());
            }
        }
        else {
            console.log('MISSED A LINE', helloLine);
        }
    }
    if (isClientHello) {
        const hello = message;
        if (hello.ciphers?.length > 0)
            hello.ciphers[0] = hello.ciphers[0].replace('UNKNOWN', 'GREASE');
        if (hello.extensions?.length > 0) {
            for (const ext of hello.extensions) {
                if (ext.type === 'UNKNOWN') {
                    if (greaseCodes.includes(ext.decimal)) {
                        ext.type = 'GREASE';
                    }
                    else {
                        ext.type = extensions[ext.decimal] ?? 'UNKNOWN';
                    }
                }
                // eslint-disable-next-line guard-for-in
                for (const x in ext.values) {
                    const value = ext.values[x];
                    for (const grease of greaseCodes) {
                        if (value.includes('UNKNOWN') && value.includes(`(${grease.toString(10)})`)) {
                            ext.values[x] = value.replace('UNKNOWN', 'GREASE');
                            break;
                        }
                    }
                }
            }
        }
    }
    return message;
}
const greaseCodes = [
    0x0a0a, 0x1a1a, 0x2a2a, 0x3a3a, 0x4a4a, 0x5a5a, 0x6a6a, 0x7a7a, 0x8a8a, 0x9a9a, 0xaaaa, 0xbaba,
    0xcaca, 0xdada, 0xeaea, 0xfafa,
];
exports.greaseCodes = greaseCodes;
//# sourceMappingURL=parseHelloMessage.js.map