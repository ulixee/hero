import * as http from 'http';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as https from 'https';
import { RequestOptions } from 'https';
import { parse } from 'url';
import { createWriteStream } from 'fs';
import { createPromise } from './utils';
import { getProxyForUrl } from './getProxyForUrl';

export default function downloadFile(
  url: string,
  destinationPath: string,
  progressCallback?: (downloadedBytes: number, totalBytes: number) => void,
): Promise<void> {
  const downloaderPromise = createPromise<void>();
  let downloadedBytes = 0;
  let totalBytes = 0;

  const request = httpGet(url, response => {
    if (response.statusCode !== 200) {
      const error = new Error(
        `Download failed: server returned code ${response.statusCode}. URL: ${url}`,
      );
      // consume response data to free up memory
      response.resume();
      downloaderPromise.reject(error);
      return;
    }
    const file = createWriteStream(destinationPath);
    file.once('finish', downloaderPromise.resolve);
    file.once('error', downloaderPromise.reject);
    response.pipe(file);
    totalBytes = parseInt(response.headers['content-length'], 10);
    if (progressCallback) response.on('data', onData);
  });
  request.once('error', downloaderPromise.reject);
  return downloaderPromise.promise;

  function onData(chunk: Buffer | string): void {
    downloadedBytes += Buffer.byteLength(chunk);
    progressCallback(downloadedBytes, totalBytes);
  }
}

export function httpGet(
  url: string,
  response: (x: http.IncomingMessage) => void,
): http.ClientRequest {
  const options = getRequestOptionsWithProxy(url);
  const httpModule = options.protocol === 'https:' ? https : http;

  const request = httpModule.request(options, (res: http.IncomingMessage): void => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      httpGet(res.headers.location, response);
    } else {
      response(res);
    }
  });
  request.end();
  return request;
}

function getRequestOptionsWithProxy(url: string): RequestOptions {
  const urlParsed = parse(url);

  const options: https.RequestOptions = {
    ...urlParsed,
    method: 'GET',
  };

  const proxyURL = getProxyForUrl(url);
  if (proxyURL) {
    if (url.startsWith('http:')) {
      return {
        path: urlParsed.href,
        host: proxyURL.hostname,
        port: proxyURL.port,
      };
    }
    options.agent = new HttpsProxyAgent(proxyURL);
    options.rejectUnauthorized = false;
  }
  return options;
}
