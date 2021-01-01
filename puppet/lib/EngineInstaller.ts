import * as os from 'os';
import ProgressBar from 'progress';
import { BrowserFetcher } from './BrowserFetcher';
import { getInstallDirectory } from "./browserPaths";

export default class EngineInstaller {
  constructor(readonly engine: { browser: string; revision: string }) {}

  public async install() {
    if (this.shouldSkipDownload()) return;

    const browserFetcher: BrowserFetcher = new BrowserFetcher({
      path: getInstallDirectory(this.engine.browser, this.engine.revision),
    });

    const revisionInfo = browserFetcher.revisionInfo(this.engine.revision);

    // Do nothing if the revision is already downloaded.
    if (revisionInfo.local) {
      npmlog(`Chromium is already in ${revisionInfo.folderPath}; skipping download.`);
      return;
    }

    setProxyEnvVars();

    try {
      let progressBar: ProgressBar = null;
      let lastDownloadedBytes = 0;
      await browserFetcher.download(revisionInfo.revision, (downloadedBytes, totalBytes) => {
        if (!progressBar) {
          progressBar = new ProgressBar(
            `Downloading Chromium r${this.engine.revision} - ${toMegabytes(
              totalBytes,
            )} [:bar] :percent :etas `,
            {
              complete: '=',
              incomplete: ' ',
              width: 20,
              total: totalBytes,
            },
          );
        }
        const delta = downloadedBytes - lastDownloadedBytes;
        lastDownloadedBytes = downloadedBytes;
        progressBar.tick(delta);
      });

      if (os.arch() !== 'arm64') {
        npmlog(`Chromium (${revisionInfo.revision}) downloaded to ${revisionInfo.folderPath}`);
      }
    } catch (error) {
      console.error(
        `ERROR: Failed to set up Chromium r${this.engine.revision}! Set "SA_SKIP_DOWNLOAD" env variable to skip download.`,
      );
      console.error(error);
      process.exit(1);
    }
  }

  private shouldSkipDownload() {
    for (const envVar of [
      'SA_SKIP_CHROMIUM_DOWNLOAD',
      'SA_SKIP_DOWNLOAD',
      'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD',
    ]) {
      if (process.env[envVar]) {
        npmlog(`**INFO** Skipping browser download. "${envVar}" environment variable was found.`);
        return true;
      }
      if (
        process.env[`NPM_CONFIG_${envVar}`] ||
        process.env[`npm_config_${envVar.toLowerCase()}`]
      ) {
        npmlog(`**INFO** Skipping browser download. "${envVar}" was set in npm config.`);
        return true;
      }
      if (
        process.env[`NPM_PACKAGE_CONFIG_${envVar}`] ||
        process.env[`npm_package_config_${envVar.toLowerCase()}`]
      ) {
        npmlog(`**INFO** Skipping browser download. "${envVar}" was set in project config.`);
        return true;
      }
    }
    return false;
  }
}

function setProxyEnvVars() {
  // Override current environment proxy settings with npm configuration, if any.
  const NPM_HTTPS_PROXY = process.env.npm_config_https_proxy || process.env.npm_config_proxy;
  const NPM_HTTP_PROXY = process.env.npm_config_http_proxy || process.env.npm_config_proxy;
  const NPM_NO_PROXY = process.env.npm_config_no_proxy;

  if (NPM_HTTPS_PROXY) process.env.HTTPS_PROXY = NPM_HTTPS_PROXY;
  if (NPM_HTTP_PROXY) process.env.HTTP_PROXY = NPM_HTTP_PROXY;
  if (NPM_NO_PROXY) process.env.NO_PROXY = NPM_NO_PROXY;
}

function toMegabytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb * 10) / 10} Mb`;
}

function npmlog(toBeLogged) {
  const logLevel = process.env.npm_config_loglevel;
  const logLevelDisplay = ['silent', 'error', 'warn'].indexOf(logLevel) > -1;

  // eslint-disable-next-line no-console
  if (!logLevelDisplay) console.log(toBeLogged);
}
