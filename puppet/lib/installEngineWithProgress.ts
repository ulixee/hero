import * as ProgressBar from 'progress';
import { IBrowserEngineConfig } from '@secret-agent/interfaces/IBrowserEngine';
import { EngineFetcher } from './EngineFetcher';
import { validateHostRequirements } from './validateHostDependencies';

export default async function installEngineWithProgress(engine: IBrowserEngineConfig) {
  if (shouldSkipDownload()) return;

  const { fullVersion, name, executablePathEnvVar } = engine;
  const browserTitle = name[0].toUpperCase() + name.slice(1);
  const engineFetcher = new EngineFetcher(name as any, fullVersion, executablePathEnvVar);

  // Do nothing if the revision is already downloaded.
  if (engineFetcher.isInstalled) {
    npmlog(`${browserTitle} ${fullVersion} is already installed; skipping download.`);
    return;
  }

  try {
    let progressBar: ProgressBar = null;
    let lastDownloadedBytes = 0;
    npmlog(`Downloading ${browserTitle} ${fullVersion} from ${engineFetcher.url}.`);
    await engineFetcher.download((downloadedBytes, totalBytes) => {
      if (!progressBar) {
        const mb = totalBytes / 1024 / 1024;
        const mbString = `${Math.round(mb * 10) / 10} Mb`;

        progressBar = new ProgressBar(
          `Downloading ${browserTitle} ${fullVersion} - ${mbString} [:bar] :percent :etas `,
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

    // don't blow up during install process if host requirements can't be met
    await validateHostRequirements(engineFetcher.toJSON()).catch(err => npmlog(err.toString()));

    npmlog(`${browserTitle} (${fullVersion}) downloaded to ${engineFetcher.browsersDir}`);
  } catch (error) {
    console.error(
      `ERROR: Failed to set up ${browserTitle} ${fullVersion}! Set "SA_SKIP_DOWNLOAD" env variable to skip download.`,
    );
    console.error(error);
    process.exit(1);
  }
}

function shouldSkipDownload() {
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

function getEnv(key: string): string {
  return process.env[key] ?? process.env[key.toUpperCase()] ?? process.env[key.toUpperCase()];
}

function npmlog(toBeLogged) {
  const logLevel = process.env.npm_config_loglevel;
  const logLevelDisplay = ['silent', 'error', 'warn'].indexOf(logLevel) > -1;

  // eslint-disable-next-line no-console
  if (!logLevelDisplay) console.log(toBeLogged);
}
