import * as Os from 'os';
import * as Fs from 'fs';
import * as Path from 'path';
import { assert } from '@secret-agent/commons/utils';
import { createGunzip } from 'zlib';
import * as Tar from 'tar';
import downloadFile from '@secret-agent/commons/downloadFile';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import { existsSync } from 'fs';

const windowsLocalAppData = process.env.LOCALAPPDATA || Path.join(Os.homedir(), 'AppData', 'Local');

export class EngineFetcher {
  public static cacheDirectoryByPlatform = {
    linux: process.env.XDG_CACHE_HOME || Path.join(Os.homedir(), '.cache'),
    mac: Path.join(Os.homedir(), 'Library', 'Caches'),
    win32: windowsLocalAppData,
    win64: windowsLocalAppData,
  };

  private static relativeBrowserExecutablePathsByOs = {
    chrome: {
      mac: Path.join('Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
      linux: 'chrome',
      win32: 'chrome.exe',
      win64: 'chrome.exe',
    },
  };

  public get cacheDir(): string {
    return EngineFetcher.cacheDirectoryByPlatform[this.platform];
  }

  public get browsersDir(): string {
    return Path.join(this.cacheDir, 'secret-agent', this.browserName);
  }

  public readonly downloadBaseUrl: string;
  public readonly browserName: 'chrome' | 'safari' | 'firefox';
  public readonly platform: 'linux' | 'mac' | 'win32' | 'win64';
  public readonly version: string;
  public readonly executablePathEnvVar: string;
  public readonly executablePath: string;

  public get isInstalled(): boolean {
    return Fs.existsSync(this.executablePath);
  }

  public get url(): string {
    const { downloadBaseUrl, version, platform } = this;

    let baseUrl = downloadBaseUrl;
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    return `${baseUrl}${version}/${this.browserName}_${version}_${platform}.tar.gz`;
  }

  public get launchArgs(): string[] {
    if (this.isWindows() && this.browserName === 'chrome') {
      return [`--chrome-version=${this.version}`];
    }
    return [];
  }

  constructor(
    browser: 'chrome' | string,
    version: string,
    executablePathEnvVar?: string,
    downloadsBaseUrl?: string,
  ) {
    this.browserName = browser as any;
    this.version = version;
    this.executablePathEnvVar = executablePathEnvVar;
    this.platform = EngineFetcher.getPlatform();

    assert(this.platform, 'This operating system is not supported');
    assert(browser === 'chrome', 'This browser is not supported');

    if (browser === 'chrome') {
      this.downloadBaseUrl =
        downloadsBaseUrl ?? 'https://github.com/ulixee/chrome-versions/releases/download/';
    }

    const relativePath =
      EngineFetcher.relativeBrowserExecutablePathsByOs[this.browserName][this.platform];

    const envVar = executablePathEnvVar ? process.env[executablePathEnvVar] : undefined;
    this.executablePath = envVar ?? Path.join(this.browsersDir, this.version, relativePath);
  }

  public async download(
    progressCallback: (downloadedBytes: number, totalBytes: number) => void,
  ): Promise<void> {
    if (this.isInstalled) return;

    const downloadFilename = this.url.split('/').pop();
    const downloadArchive = Path.resolve(this.browsersDir, downloadFilename);
    if (!existsSync(this.browsersDir)) Fs.mkdirSync(this.browsersDir, { recursive: true });

    try {
      await downloadFile(this.url, downloadArchive, progressCallback);
      let cwd = this.browsersDir;
      // mac needs to be extracted directly into version directory
      if (this.platform === 'mac') {
        cwd = Path.join(cwd, this.version);
      }
      if (!existsSync(cwd)) Fs.mkdirSync(cwd, { recursive: true });

      await new Promise(resolve => {
        Fs.createReadStream(downloadArchive)
          .pipe(createGunzip())
          .pipe(
            Tar.extract({
              cwd,
            }),
          )
          .on('finish', resolve);
      });
      await Fs.promises.chmod(this.executablePath, 0o755);
    } finally {
      if (Fs.existsSync(downloadArchive)) {
        await Fs.promises.unlink(downloadArchive);
      }
    }
  }

  public toJSON(): IBrowserEngine & { isInstalled: boolean } {
    return {
      browser: this.browserName,
      version: this.version,
      executablePath: this.executablePath,
      executablePathEnvVar: this.executablePathEnvVar,
      isInstalled: this.isInstalled,
      extraLaunchArgs: this.launchArgs,
    };
  }

  private isWindows(): boolean {
    return this.platform === 'win32' || this.platform === 'win64';
  }

  private static getPlatform(): EngineFetcher['platform'] {
    const platform = Os.platform();
    if (platform === 'darwin') return 'mac';
    if (platform === 'linux') return 'linux';
    if (platform === 'win32') return Os.arch() === 'x64' ? 'win64' : 'win32';
  }
}
