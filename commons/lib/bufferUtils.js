"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatAsBuffer = concatAsBuffer;
exports.bufferToBigInt = bufferToBigInt;
exports.xor = xor;
exports.bufferReplacer = bufferReplacer;
exports.encodeBuffer = encodeBuffer;
exports.decodeBuffer = decodeBuffer;
exports.decompressBuffer = decompressBuffer;
const bech32_1 = require("bech32");
const util_1 = require("util");
const zlib = require("zlib");
const inflateAsync = (0, util_1.promisify)(zlib.inflate);
const inflateRawAsync = (0, util_1.promisify)(zlib.inflateRaw);
const brotliDecompressAsync = (0, util_1.promisify)(zlib.brotliDecompress);
const gunzipAsync = (0, util_1.promisify)(zlib.gunzip);
function concatAsBuffer(...items) {
    return Buffer.concat(items.map(x => {
        if (Buffer.isBuffer(x))
            return x;
        if (!x && x !== 0) {
            return Buffer.from('');
        }
        return Buffer.from(String(x));
    }));
}
function bufferToBigInt(buffer) {
    return BigInt(`0x${buffer.toString('hex')}`);
}
function xor(a, b) {
    if (a.length !== b.length) {
        throw new Error('Inputs should have the same length');
    }
    const result = Buffer.allocUnsafe(a.length);
    for (let i = 0; i < a.length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}
function bufferReplacer(key, value) {
    if (value && Buffer.isBuffer(value)) {
        return value.toString('hex');
    }
    return value;
}
function encodeBuffer(digest, prefix) {
    const words = bech32_1.bech32m.toWords(digest);
    return bech32_1.bech32m.encode(prefix, words, 256);
}
function decodeBuffer(encoded, expectedPrefix) {
    const { prefix, words } = bech32_1.bech32m.decode(encoded, 256);
    if (prefix !== expectedPrefix) {
        throw new Error(`The encoded hash had a different prefix (${prefix}) than expected (${expectedPrefix}).`);
    }
    return Buffer.from(bech32_1.bech32m.fromWords(words));
}
function decompressBuffer(buffer, encoding) {
    if (!buffer || !encoding)
        return Promise.resolve(buffer);
    if (encoding === 'gzip' || encoding === 'x-gzip') {
        // from node-fetch:
        // Be less strict when decoding compressed responses, since sometimes
        // servers send slightly invalid responses that are still accepted
        // by common browsers.
        const zlibOptions = {
            flush: zlib.constants.Z_SYNC_FLUSH,
            finishFlush: zlib.constants.Z_SYNC_FLUSH,
        };
        return gunzipAsync(buffer, zlibOptions);
    }
    if (encoding === 'deflate' || encoding === 'x-deflate') {
        if ((buffer[0] & 0x0f) === 0x08) {
            return inflateAsync(buffer);
        }
        return inflateRawAsync(buffer);
    }
    if (encoding === 'br') {
        return brotliDecompressAsync(buffer);
    }
    return Promise.resolve(buffer);
}
//# sourceMappingURL=bufferUtils.js.map