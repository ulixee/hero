import * as os from 'os';
import * as ProgressBar from 'progress';
import { IBrowserEngineConfig } from '@secret-agent/core-interfaces/IBrowserEngine';
import { EngineFetcher } from './EngineFetcher';

export default class EngineInstaller {
  constructor(readonly engine: IBrowserEngineConfig) {}

  public async install() {
    if (this.shouldSkipDownload()) return;

    const { version, browser, executablePathEnvVar } = this.engine;
    const browserTitle = browser[0].toUpperCase() + browser.slice(1);
    const engineFetcher = new EngineFetcher(browser as any, version, executablePathEnvVar);

    // Do nothing if the revision is already downloaded.
    if (engineFetcher.isInstalled) {
      npmlog(
        `${browserTitle} is already in ${engineFetcher.browserVersionDir}; skipping download.`,
      );
      return;
    }

    try {
      let progressBar: ProgressBar = null;
      let lastDownloadedBytes = 0;
      npmlog(`Downloading ${browserTitle} ${version} from ${engineFetcher.url}.`);
      const furtherInstall = await engineFetcher.download((downloadedBytes, totalBytes) => {
        if (!progressBar) {
          const mb = totalBytes / 1024 / 1024;
          const mbString = `${Math.round(mb * 10) / 10} Mb`;

          progressBar = new ProgressBar(
            `Downloading ${browserTitle} ${version} - ${mbString} [:bar] :percent :etas `,
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

      if (furtherInstall) {
        console.log('Please run the following command to install %s %s', browserTitle, version, {
          command: furtherInstall.installCommand,
        });
      }

      if (os.arch() !== 'arm64') {
        npmlog(`${browserTitle} (${version}) downloaded to ${engineFetcher.browserVersionDir}`);
      }
    } catch (error) {
      console.error(
        `ERROR: Failed to set up ${browserTitle} ${version}! Set "SA_SKIP_DOWNLOAD" env variable to skip download.`,
      );
      console.error(error);
      process.exit(1);
    }
  }

  private shouldSkipDownload() {
    for (const envVar of [
      'SA_SKIP_CHROME_DOWNLOAD',
      'SA_SKIP_CHROMIUM_DOWNLOAD',
      'SA_SKIP_DOWNLOAD',
    ]) {
      if (getEnv(envVar)) {
        npmlog(`**INFO** Skipping browser download. "${envVar}" environment variable was found.`);
        return true;
      }
      if (getEnv(`NPM_CONFIG_${envVar}`)) {
        npmlog(`**INFO** Skipping browser download. "${envVar}" was set in npm config.`);
        return true;
      }
      if (getEnv(`NPM_PACKAGE_CONFIG_${envVar}`)) {
        npmlog(`**INFO** Skipping browser download. "${envVar}" was set in project config.`);
        return true;
      }
    }
    return false;
  }
}

function getEnv(key: string): string {
  return process.env[key] ?? process.env[key.toUpperCase()] ?? process.env[key.toUpperCase()];
}

function npmlog(toBeLogged) {
  const logLevel = process.env.npm_config_loglevel;
  const logLevelDisplay = ['silent', 'error', 'warn'].indexOf(logLevel) > -1;

  // eslint-disable-next-line no-console
  if (!logLevelDisplay) console.log(toBeLogged);
}
