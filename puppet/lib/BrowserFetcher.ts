/**
 * Copyright 2020 Data Liberation Foundation, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as os from 'os';
import { createWriteStream, existsSync, promises as fs } from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as childProcess from 'child_process';
import * as https from 'https';
import * as http from 'http';

import * as extractZip from 'extract-zip';
import * as removeRecursive from 'rimraf';
import * as URL from 'url';
import { HttpsProxyAgent, HttpsProxyAgentOptions } from 'https-proxy-agent';
import { getProxyForUrl } from 'proxy-from-env';
import { assert } from '@secret-agent/commons/utils';

const downloadURLs = {
  linux: '%s/chromium-browser-snapshots/Linux_x64/%d/%s.zip',
  mac: '%s/chromium-browser-snapshots/Mac/%d/%s.zip',
  win32: '%s/chromium-browser-snapshots/Win/%d/%s.zip',
  win64: '%s/chromium-browser-snapshots/Win_x64/%d/%s.zip',
};

const browserConfig = {
  host: 'https://storage.googleapis.com',
  destination: '.local-chromium',
};

/**
 * Supported platforms.
 * @public
 */
type Platform = 'linux' | 'mac' | 'win32' | 'win64';

function archiveName(platform: Platform, revision: string): string {
  if (platform === 'linux') return 'chrome-linux';
  if (platform === 'mac') return 'chrome-mac';
  if (platform === 'win32' || platform === 'win64') {
    // Windows archive name changed at r591479.
    return parseInt(revision, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
  }
}

/**
 * @internal
 */
function downloadURL(platform: Platform, host: string, revision: string): string {
  return util.format(downloadURLs[platform], host, revision, archiveName(platform, revision));
}

function existsAsync(filePath: string): Promise<boolean> {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

/**
 * @public
 */
export interface BrowserFetcherOptions {
  path: string;
  platform?: Platform;
  host?: string;
}

/**
 * @public
 */
export interface BrowserFetcherRevisionInfo {
  folderPath: string;
  executablePath: string;
  url: string;
  local: boolean;
  revision: string;
}
/**
 * BrowserFetcher can download and manage different versions of Chromium
 *
 * @remarks
 * BrowserFetcher operates on revision strings that specify a precise version of Chromium, e.g. `"533271"`. Revision strings can be obtained from {@link http://omahaproxy.appspot.com/ | omahaproxy.appspot.com}.
 *
 * @example
 * An example of using BrowserFetcher to download a specific version of Chromium
 * and running PuppetChrome against it:
 *
 * ```js
 * const browserFetcher = new BrowserFetcher();
 * const revisionInfo = await browserFetcher.download('533271');
 * const browser = await puppetChrome.launch({executablePath: revisionInfo.executablePath})
 * ```
 *
 * **NOTE** BrowserFetcher is not designed to work concurrently with other
 * instances of BrowserFetcher that share the same downloads directory.
 *
 * @public
 */

export class BrowserFetcher {
  private _downloadsFolder: string;
  private _downloadHost: string;
  private _platform: Platform;

  constructor(options: BrowserFetcherOptions) {
    this._downloadsFolder = options.path;
    this._downloadHost = options.host || browserConfig.host;
    this.setPlatform(options.platform);
    assert(downloadURLs[this._platform], `Unsupported platform: ${this._platform}`);
  }

  /**
   * @returns Returns the current `Platform`.
   */
  public platform(): Platform {
    return this._platform;
  }

  /**
   * @returns The download host being used.
   */
  public host(): string {
    return this._downloadHost;
  }

  /**
   * Initiates a HEAD request to check if the revision is available.
   * @remarks
   * This method is affected by the current `product`.
   * @param revision - The revision to check availability for.
   * @returns A promise that resolves to `true` if the revision could be downloaded
   * from the host.
   */
  public canDownload(revision: string): Promise<boolean> {
    const url = downloadURL(this._platform, this._downloadHost, revision);
    return new Promise(resolve => {
      const request = httpRequest(url, 'HEAD', response => {
        resolve(response.statusCode === 200);
      });
      request.on('error', error => {
        // eslint-disable-next-line no-console
        console.error(error);
        resolve(false);
      });
    });
  }

  /**
   * Initiates a GET request to download the revision from the host.
   * @remarks
   * This method is affected by the current `product`.
   * @param revision - The revision to download.
   * @param progressCallback - A function that will be called with two arguments:
   * How many bytes have been downloaded and the total number of bytes of the download.
   * @returns A promise with revision information when the revision is downloaded
   * and extracted.
   */
  public async download(
    revision: string,
    progressCallback: (x: number, y: number) => void = (): void => {},
  ): Promise<BrowserFetcherRevisionInfo> {
    const url = downloadURL(this._platform, this._downloadHost, revision);
    const fileName = url.split('/').pop();
    const archivePath = path.join(this._downloadsFolder, fileName);
    const outputPath = this._getFolderPath(revision);
    if (await existsAsync(outputPath)) return this.revisionInfo(revision);
    if (!(await existsAsync(this._downloadsFolder)))
      await fs.mkdir(this._downloadsFolder, { recursive: true });
    if (os.arch() === 'arm64') {
      throw new Error('The chromium binary is not available for arm64');
    }
    try {
      await downloadFile(url, archivePath, progressCallback);
      await install(archivePath, outputPath);
    } finally {
      if (await existsAsync(archivePath)) await fs.unlink(archivePath);
    }
    const revisionInfo = this.revisionInfo(revision);
    if (revisionInfo) await fs.chmod(revisionInfo.executablePath, 0o755);
    return revisionInfo;
  }

  /**
   * @remarks
   * This method is affected by the current `product`.
   * @returns A promise with a list of all revision strings (for the current `product`)
   * available locally on disk.
   */
  public async localRevisions(): Promise<string[]> {
    if (!(await existsAsync(this._downloadsFolder))) return [];
    const fileNames = await fs.readdir(this._downloadsFolder);
    return fileNames
      .map(fileName => parseFolderPath(fileName))
      .filter(entry => entry && entry.platform === this._platform)
      .map(entry => entry.revision);
  }

  /**
   * @remarks
   * This method is affected by the current `product`.
   * @param revision - A revision to remove for the current `product`.
   * @returns A promise that resolves when the revision has been removes or
   * throws if the revision has not been downloaded.
   */
  public async remove(revision: string): Promise<void> {
    const folderPath = this._getFolderPath(revision);
    assert(
      await existsAsync(folderPath),
      `Failed to remove: revision ${revision} is not downloaded`,
    );
    await new Promise(resolve => removeRecursive(folderPath, resolve));
  }

  /**
   * @param revision - The revision to get info for.
   * @returns The revision info for the given revision.
   */
  public revisionInfo(revision: string, printRevisionInfo = true): BrowserFetcherRevisionInfo {
    const folderPath = this._getFolderPath(revision);
    let executablePath = '';
    if (this._platform === 'mac')
      executablePath = path.join(
        folderPath,
        archiveName(this._platform, revision),
        'Chromium.app',
        'Contents',
        'MacOS',
        'Chromium',
      );
    else if (this._platform === 'linux')
      executablePath = path.join(folderPath, archiveName(this._platform, revision), 'chrome');
    else if (this._platform === 'win32' || this._platform === 'win64')
      executablePath = path.join(folderPath, archiveName(this._platform, revision), 'chrome.exe');
    else throw new Error(`Unsupported platform: ${this._platform}`);

    const url = downloadURL(this._platform, this._downloadHost, revision);
    const local = existsSync(folderPath);
    const revisionInfo = {
      revision,
      executablePath,
      folderPath,
      local,
      url,
    };
    if (printRevisionInfo) {
      npmlog(revisionInfo);
    }
    return revisionInfo;
  }

  /**
   * @internal
   */
  private _getFolderPath(revision: string): string {
    return path.join(this._downloadsFolder, `${this._platform}-${revision}`);
  }

  private setPlatform(platformFromOptions?: Platform): void {
    if (platformFromOptions) {
      this._platform = platformFromOptions;
      return;
    }

    const platform = os.platform();
    if (platform === 'darwin') this._platform = 'mac';
    else if (platform === 'linux') this._platform = 'linux';
    else if (platform === 'win32') this._platform = os.arch() === 'x64' ? 'win64' : 'win32';
    else assert(this._platform, `Unsupported platform: ${os.platform()}`);
  }
}

function parseFolderPath(folderPath: string): { platform: string; revision: string } | null {
  const name = path.basename(folderPath);
  const splits = name.split('-');
  if (splits.length !== 2) return null;
  const [platform, revision] = splits;
  if (!downloadURLs[platform]) return null;
  return { platform, revision };
}

/**
 * @internal
 */
function downloadFile(
  url: string,
  destinationPath: string,
  progressCallback: (x: number, y: number) => void,
): Promise<void> {
  npmlog(`Downloading binary from ${url}`);
  let downloadResolve;
  let downloadReject;
  let downloadedBytes = 0;
  let totalBytes = 0;

  const promise = new Promise<void>((resolve, reject) => {
    downloadResolve = resolve;
    downloadReject = reject;
  });

  const request = httpRequest(url, 'GET', response => {
    if (response.statusCode !== 200) {
      const error = new Error(
        `Download failed: server returned code ${response.statusCode}. URL: ${url}`,
      );
      // consume response data to free up memory
      response.resume();
      downloadReject(error);
      return;
    }
    const file = createWriteStream(destinationPath);
    file.on('finish', () => downloadResolve());
    file.on('error', error => downloadReject(error));
    response.pipe(file);
    totalBytes = parseInt(/** @type {string} */ response.headers['content-length'], 10);
    if (progressCallback) response.on('data', onData);
  });
  request.on('error', error => downloadReject(error));
  return promise;

  function onData(chunk: string): void {
    downloadedBytes += chunk.length;
    progressCallback(downloadedBytes, totalBytes);
  }
}

function install(archivePath: string, folderPath: string): Promise<unknown> {
  npmlog(`Installing ${archivePath} to ${folderPath}`);
  if (archivePath.endsWith('.zip')) return extractZip(archivePath, { dir: folderPath });
  if (archivePath.endsWith('.dmg')) {
    return fs
      .mkdir(folderPath, { recursive: true })
      .then(() => installDMG(archivePath, folderPath));
  }
  throw new Error(`Unsupported archive format: ${archivePath}`);
}

/**
 * @internal
 */
async function installDMG(dmgPath: string, folderPath: string): Promise<void> {
  const mountCommand = `hdiutil attach -nobrowse -noautoopen "${dmgPath}"`;
  const stdout = childProcess.execSync(mountCommand, { encoding: 'utf8' });

  let mountPath: string;
  try {
    const volumes = stdout.match(/\/Volumes\/(.*)/m);

    if (!volumes) throw new Error(`Could not find volume path in ${stdout}`);
    mountPath = volumes[0];

    const fileNames = await fs.readdir(mountPath);

    const appName = fileNames.filter(item => typeof item === 'string' && item.endsWith('.app'))[0];
    if (!appName) throw new Error(`Cannot find app in ${mountPath}`);
    const copyPath = path.join(mountPath, appName);
    npmlog(`Copying ${copyPath} to ${folderPath}`);
    childProcess.execSync(`cp -R "${copyPath}" "${folderPath}"`);
  } finally {
    if (mountPath) {
      const unmountCommand = `hdiutil detach "${mountPath}" -quiet`;
      npmlog(`Unmounting ${mountPath}`);
      childProcess.exec(unmountCommand, err => {
        // eslint-disable-next-line no-console
        if (err) console.error(`Error unmounting dmg: ${err}`);
      });
    }
  }
}

function httpRequest(
  url: string,
  method: string,
  response: (x: http.IncomingMessage) => void,
): http.ClientRequest {
  const urlParsed = URL.parse(url);

  type Options = Partial<URL.UrlWithStringQuery> & {
    method?: string;
    agent?: HttpsProxyAgent;
    rejectUnauthorized?: boolean;
  };

  let options: Options = {
    ...urlParsed,
    method,
  };

  const proxyURL = getProxyForUrl(url);
  if (proxyURL) {
    if (url.startsWith('http:')) {
      const proxy = URL.parse(proxyURL);
      options = {
        path: options.href,
        host: proxy.hostname,
        port: proxy.port,
      };
    } else {
      const parsedProxyURL = URL.parse(proxyURL);

      const proxyOptions = {
        ...parsedProxyURL,
        secureProxy: parsedProxyURL.protocol === 'https:',
      } as HttpsProxyAgentOptions;

      options.agent = new HttpsProxyAgent(proxyOptions);
      options.rejectUnauthorized = false;
    }
  }

  const requestCallback = (res: http.IncomingMessage): void => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
      httpRequest(res.headers.location, method, response);
    else response(res);
  };
  const request =
    options.protocol === 'https:'
      ? https.request(options, requestCallback)
      : http.request(options, requestCallback);
  request.end();
  return request;
}

function npmlog(toBeLogged) {
  const logLevel = process.env.npm_config_loglevel;
  const logLevelDisplay = ['silent', 'error', 'warn'].indexOf(logLevel) > -1;

  // eslint-disable-next-line no-console
  if (!logLevelDisplay) console.log(toBeLogged);
}
