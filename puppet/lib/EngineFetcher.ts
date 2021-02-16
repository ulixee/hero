import * as Os from 'os';
import * as Fs from 'fs';
import * as Path from 'path';
import { assert } from '@secret-agent/commons/utils';
import { createGunzip } from 'zlib';
import * as Tar from 'tar';
import downloadFile from '@secret-agent/commons/downloadFile';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import * as LinuxUtils from './LinuxUtils';

export class EngineFetcher {
  private static linuxInstallerDirector = '/tmp/secret-agent/browser-installers';
  private static windowsLocalAppData =
    process.env.LOCALAPPDATA || Path.join(Os.homedir(), 'AppData', 'Local');

  private static cacheDirectoryByPlatform = {
    linux: process.env.XDG_CACHE_HOME || Path.join(Os.homedir(), '.cache'),
    mac: Path.join(Os.homedir(), 'Library', 'Caches'),
    win32: EngineFetcher.windowsLocalAppData,
    win64: EngineFetcher.windowsLocalAppData,
  };

  private static chromeDirectoryByPlatform = {
    linux: '/opt/google/chrome',
    mac: `${EngineFetcher.cacheDirectoryByPlatform.mac}/secret-agent/chrome`,
    win32: `${EngineFetcher.cacheDirectoryByPlatform.win32}/secret-agent/chrome`,
    win64: `${EngineFetcher.cacheDirectoryByPlatform.win64}/secret-agent/chrome`,
  };

  private static relativeBrowserExecutablePathsByOs = {
    chrome: {
      mac: Path.join('Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
      linux: 'chrome',
      win32: 'chrome.exe',
      win64: 'chrome.exe',
    },
  };

  public readonly downloadBaseUrl: string;
  public readonly browserName: 'chrome' | 'safari' | 'firefox';
  public readonly platform: 'linux' | 'mac' | 'win32' | 'win64';
  public readonly version: string;
  public readonly browserVersionDir: string;
  public readonly executablePathEnvVar: string;
  public readonly executablePath: string;

  public get isInstalled(): boolean {
    return Fs.existsSync(this.executablePath);
  }

  public get url(): string {
    const { downloadBaseUrl, version, platform } = this;

    let baseUrl = downloadBaseUrl;
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    const ext = this.platform === 'linux' ? 'deb' : 'tar.gz';

    return `${baseUrl}${version}/${this.browserName}_${version}_${platform}.${ext}`;
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
    executablePathEnvVar: string,
    downloadsBaseUrl?: string,
  ) {
    this.browserName = browser as any;
    this.version = version;
    this.executablePathEnvVar = executablePathEnvVar;
    this.platform = EngineFetcher.getPlatform();

    assert(this.platform, 'This operating system is not supported');
    assert(browser === 'chrome', 'This browser is not yet support');

    if (browser === 'chrome') {
      this.browserVersionDir = Path.join(
        EngineFetcher.chromeDirectoryByPlatform[this.platform],
        version,
      );
      this.downloadBaseUrl =
        downloadsBaseUrl ?? 'https://github.com/ulixee/chrome-versions/releases/download/';
    }

    const relativePath =
      EngineFetcher.relativeBrowserExecutablePathsByOs[this.browserName][this.platform];

    this.executablePath =
      process.env[executablePathEnvVar] ?? Path.join(this.browserVersionDir, relativePath);
  }

  public async download(
    progressCallback: (downloadedBytes: number, totalBytes: number) => void,
  ): Promise<{ installCommand: string } | undefined> {
    if (this.isInstalled) return;
    // linux doesn't actually extract anything, so don't run this download
    if (this.platform === 'linux') {
      return await this.downloadOnLinux(progressCallback);
    }

    if (!Fs.existsSync(this.browserVersionDir)) {
      Fs.mkdirSync(this.browserVersionDir, { recursive: true });
    }

    const downloadFilename = this.url.split('/').pop();
    const downloadArchive = Path.resolve(this.browserVersionDir, '..', downloadFilename);
    try {
      await downloadFile(this.url, downloadArchive, progressCallback);
      // windows is already in a version folder
      const cwd = this.isWindows()
        ? Path.resolve(this.browserVersionDir, '..')
        : this.browserVersionDir;

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
      Fs.chmodSync(this.executablePath, 0o755);
    } finally {
      if (Fs.existsSync(downloadArchive)) {
        Fs.unlinkSync(downloadArchive);
      }
    }
  }

  public async downloadOnLinux(
    progressCallback: (downloadedBytes: number, totalBytes: number) => void,
  ): Promise<{ installCommand: string }> {
    if (this.isInstalled) return;

    const isDebianLinux = await LinuxUtils.isDebianFlavor();
    const downloadsDir = EngineFetcher.linuxInstallerDirector;

    if (!Fs.existsSync(downloadsDir)) {
      Fs.mkdirSync(downloadsDir, { recursive: true });
    }

    if (isDebianLinux) {
      const downloadedInstaller = `${downloadsDir}/${this.browserName}_${this.version}.deb`;
      await downloadFile(this.url, downloadedInstaller, progressCallback);
    }

    return {
      installCommand: await this.getPendingInstallCommand(),
    };
  }

  public async getPendingInstallCommand(): Promise<string> {
    if (this.platform === 'linux') {
      if (!(await LinuxUtils.isDebianFlavor())) {
        return `SecretAgent does not yet automatically install browsers on this flavor of linux.

You can install ${this.browserName}@${this.version} to "${this.executablePath}".

Or set the executablePath of your installation to the environment variable "${this.executablePathEnvVar}" (eg, ${this.executablePathEnvVar}=[path])`;
      }

      const downloadedInstaller = `${EngineFetcher.linuxInstallerDirector}/${this.browserName}_${this.version}.deb`;
      if (Fs.existsSync(downloadedInstaller)) {
        return `sudo chown _apt ${downloadedInstaller} && sudo apt -y install ${downloadedInstaller} && rm ${downloadedInstaller}`;
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
