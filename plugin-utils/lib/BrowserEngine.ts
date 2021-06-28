import { existsSync } from 'fs';
import * as os from 'os';
import * as Path from 'path';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import IBrowserEngineOption from '@secret-agent/interfaces/IBrowserEngineOption';
import { validateHostRequirements } from './validateHostDependencies';
import { EngineFetcher } from './EngineFetcher';

let sessionDirCounter = 0;

export default class BrowserEngine implements IBrowserEngine {
  public name: string;
  public fullVersion: string;
  public executablePath: string;
  public executablePathEnvVar: string;

  public isHeaded?: boolean;
  public isInstalled: boolean;

  private readonly npmPackageName: any;
  private readonly engineFetcher: EngineFetcher;

  constructor(npmPackageId: string, { name, fullVersion, executablePathEnvVar }: IBrowserEngineOption) {
    this.npmPackageName = npmPackageId;
    this.engineFetcher = new EngineFetcher(name, fullVersion, executablePathEnvVar);

    this.name = this.engineFetcher.browserName;
    this.fullVersion = this.engineFetcher.fullVersion;
    this.executablePath = this.engineFetcher.executablePath;
    this.executablePathEnvVar = this.engineFetcher.executablePathEnvVar;
    this.isInstalled = this.engineFetcher.isInstalled;
  }

  public getLaunchArguments(
    options: {
      showBrowser?: boolean;
      disableGpu?: boolean;
      disableDevtools?: boolean;
    },
    defaultArguments: string[],
  ): string[] {
    const chromeArguments = [
      ...defaultArguments,
      ...this.engineFetcher.launchArgs,
      '--disable-background-networking', // Disable various background network services, including extension updating,safe browsing service, upgrade detector, translate, UMA
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--disable-background-timer-throttling', // Disable timers being throttled in background pages/tabs
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad', // Disable crashdump collection (reporting is already disabled in Chromium)
      '--disable-client-side-phishing-detection', //  Disables client-side phishing detection.
      '--disable-domain-reliability', // Disables Domain Reliability Monitoring, which tracks whether the browser has difficulty contacting Google-owned sites and uploads reports to Google.
      '--disable-default-apps', // Disable installation of default apps on first run
      '--disable-dev-shm-usage', // https://github.com/GoogleChrome/puppeteer/issues/1834
      '--disable-extensions', // Disable all chrome extensions.
      '--disable-features=PaintHolding,TranslateUI,site-per-process,OutOfBlinkCors', // site-per-process = Disables OOPIF, OutOfBlinkCors = Disables feature in chrome80/81 for out of process cors
      '--disable-blink-features=AutomationControlled',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection', // Some javascript functions can be used to flood the browser process with IPC. By default, protection is on to limit the number of IPC sent to 10 per second per frame.
      '--disable-prompt-on-repost', // Reloading a page that came from a POST normally prompts the user.
      '--disable-renderer-backgrounding', // This disables non-foreground tabs from getting a lower process priority This doesn't (on its own) affect timers or painting behavior. karma-chrome-launcher#123
      '--disable-sync', // Disable syncing to a Google account

      '--force-color-profile=srgb', // Force all monitors to be treated as though they have the specified color profile.
      '--use-gl=any', // Select which implementation of GL the GPU process should use. Options are: desktop: whatever desktop OpenGL the user has installed (Linux and Mac default). egl: whatever EGL / GLES2 the user has installed (Windows default - actually ANGLE). swiftshader: The SwiftShader software renderer.
      '--disable-partial-raster', // https://crbug.com/919955
      '--disable-skia-runtime-opts', // Do not use runtime-detected high-end CPU optimizations in Skia.

      '--incognito',

      '--use-fake-device-for-media-stream',

      '--no-default-browser-check', //  Disable the default browser check, do not prompt to set it as such
      '--metrics-recording-only', // Disable reporting to UMA, but allows for collection
      '--no-first-run', // Skip first run wizards

      // '--enable-automation', BAB - disable because adds infobar, stops auto-reload on network errors (using other flags)
      '--enable-auto-reload', // Enable auto-reload of error pages.

      '--password-store=basic', // Avoid potential instability of using Gnome Keyring or KDE wallet.
      '--use-mock-keychain', // Use mock keychain on Mac to prevent blocking permissions dialogs
      '--allow-running-insecure-content',

      // don't leak private ip
      '--force-webrtc-ip-handling-policy=default_public_interface_only',
      '--no-startup-window',
    ];

    if (options.showBrowser) {
      chromeArguments.push(
        `--user-data-dir=${Path.join(
          os.tmpdir(),
          this.fullVersion.replace('.', '-'),
          '-data',
          String((sessionDirCounter += 1)),
        )}`,
      ); // required to allow multiple browsers to be headed

      if (!options.disableDevtools) chromeArguments.push('--auto-open-devtools-for-tabs');
    } else {
      chromeArguments.push(
        '--hide-scrollbars',
        '--mute-audio',
        '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4', // adds cursor to headless linux
      );
    }

    if (options.disableGpu === true) {
      chromeArguments.push('--disable-gpu', '--disable-software-rasterizer');
      const idx = chromeArguments.indexOf('--use-gl=any');
      if (idx >= 0) chromeArguments.splice(idx, 1);
    }
    return chromeArguments;
  }

  public async verifyLaunchable(): Promise<void> {
    if (!existsSync(this.executablePath)) {
      let remedyMessage = `No executable exists at "${this.executablePath}"`;

      const isCustomInstall = this.executablePathEnvVar && process.env[this.executablePathEnvVar];
      if (!isCustomInstall) {
        remedyMessage = `Please re-install the browser engine:
-------------------------------------------------
-------------- NPM INSTALL ----------------------
-------------------------------------------------

 npm install ${this.npmPackageName}

-------------------------------------------------
`;
      }
      throw new Error(`Failed to launch ${this.name} ${this.fullVersion}:

${remedyMessage}`);
    }
    // exists, validate that host requirements exist
    await validateHostRequirements(this);
  }
}
