"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = downloadFile;
exports.httpGet = httpGet;
const http = require("http");
const https_proxy_agent_1 = require("https-proxy-agent");
const https = require("https");
const url_1 = require("url");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const getProxyForUrl_1 = require("./getProxyForUrl");
function downloadFile(url, destinationPath, progressCallback) {
    const downloaderPromise = (0, utils_1.createPromise)();
    let downloadedBytes = 0;
    let totalBytes = 0;
    const request = httpGet(url, response => {
        if (response.statusCode !== 200) {
            const error = new Error(`Download failed: server returned code ${response.statusCode}. URL: ${url}`);
            // consume response data to free up memory
            response.resume();
            downloaderPromise.reject(error);
            return;
        }
        const file = (0, fs_1.createWriteStream)(destinationPath);
        file.once('finish', downloaderPromise.resolve);
        file.once('error', downloaderPromise.reject);
        response.pipe(file);
        totalBytes = parseInt(response.headers['content-length'], 10);
        if (progressCallback)
            response.on('data', onData);
    });
    request.once('error', downloaderPromise.reject);
    return downloaderPromise.promise;
    function onData(chunk) {
        downloadedBytes += Buffer.byteLength(chunk);
        progressCallback(downloadedBytes, totalBytes);
    }
}
function httpGet(url, response) {
    const options = getRequestOptionsWithProxy(url);
    const httpModule = options.protocol === 'https:' ? https : http;
    const request = httpModule.request(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            httpGet(res.headers.location, response);
        }
        else {
            response(res);
        }
    });
    request.end();
    return request;
}
function getRequestOptionsWithProxy(url) {
    const urlParsed = (0, url_1.parse)(url);
    const options = {
        ...urlParsed,
        method: 'GET',
    };
    const proxyURL = (0, getProxyForUrl_1.getProxyForUrl)(url);
    if (proxyURL) {
        if (url.startsWith('http:')) {
            return {
                path: urlParsed.href,
                host: proxyURL.hostname,
                port: proxyURL.port,
            };
        }
        options.agent = new https_proxy_agent_1.HttpsProxyAgent(proxyURL);
        options.rejectUnauthorized = false;
    }
    return options;
}
//# sourceMappingURL=downloadFile.js.map