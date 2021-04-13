import IPuppetBrowser from '@secret-agent/puppet-interfaces/IPuppetBrowser';
import ILaunchedProcess from '@secret-agent/puppet-interfaces/ILaunchedProcess';
import IPuppetLauncher from '@secret-agent/puppet-interfaces/IPuppetLauncher';
import * as os from 'os';
import * as Path from 'path';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import { IPuppetLaunchError } from '@secret-agent/puppet-interfaces/IPuppetLaunchError';
import { Browser } from './lib/Browser';
import { Connection } from './lib/Connection';

let counter = 0;

const PuppetLauncher: IPuppetLauncher = {
  getLaunchArgs(options: {
    proxyPort?: number;
    showBrowser?: boolean;
    disableGpu?: boolean;
    disableDevtools?: boolean;
    disableSandbox?: boolean;
  }) {
    const chromeArguments = [...defaultArgs];
    if (!options.showBrowser) {
      chromeArguments.push(
        '--headless',
        '--hide-scrollbars',
        '--mute-audio',
        '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4', // adds cursor to headless linux
      );
    } else {
      chromeArguments.push(
        `--user-data-dir=${Path.join(os.tmpdir(), 'chromium-headed-data', String((counter += 1)))}`,
      ); // required to allow multiple browsers to be headed

      if (!options.disableDevtools) chromeArguments.push('--auto-open-devtools-for-tabs');
    }

    if (options.proxyPort !== undefined) {
      chromeArguments.push(`--proxy-server=localhost:${options.proxyPort}`);
    }

    if (options.disableGpu === true) {
      chromeArguments.push('--disable-gpu', '--disable-software-rasterizer');
      const idx = chromeArguments.indexOf('--use-gl=any');
      if (idx >= 0) chromeArguments.splice(idx, 1);
    }

    if (options.disableSandbox === true) {
      chromeArguments.push('--no-sandbox');
    } else if (os.platform() === 'linux') {
      const runningAsRoot = process.geteuid && process.geteuid() === 0;
      if (runningAsRoot) {
        // eslint-disable-next-line no-console
        console.warn(
          'WARNING: Secret-Agent is being run under "root" user - disabling Chromium sandbox! ' +
            'Run under regular user to get rid of this warning.',
        );
        chromeArguments.push('--no-sandbox');
      }
    }
    return chromeArguments;
  },
  async createPuppet(process: ILaunchedProcess, engine: IBrowserEngine): Promise<IPuppetBrowser> {
    const { transport, close } = process;
    try {
      const connection = new Connection(transport);
      return await Browser.create(connection, engine, close);
    } catch (error) {
      await close();
      throw error;
    }
  },
  translateLaunchError(rawError: Error): IPuppetLaunchError {
    // These error messages are taken from Chromium source code as of July, 2020:
    // https://github.com/chromium/chromium/blob/70565f67e79f79e17663ad1337dc6e63ee207ce9/content/browser/zygote_host/zygote_host_impl_linux.cc
    const error = {
      message: rawError.message,
      stack: rawError.stack,
      name: 'PuppetLaunchError',
      isSandboxError: false,
    };
    if (
      error.message.includes('crbug.com/357670') ||
      error.message.includes('No usable sandbox!') ||
      error.message.includes('crbug.com/638180')
    ) {
      error.stack += [
        `\nChromium sandboxing failed!`,
        `================================`,
        `To workaround sandboxing issues, do either of the following:`,
        `  - (preferred): Configure environment to support sandboxing (as here: https://github.com/ulixee/secret-agent/tree/master/tools/docker)`,
        `  - (alternative): Launch Chromium without sandbox using 'SA_NO_CHROME_SANDBOX=false' environmental variable`,
        `================================`,
        ``,
      ].join('\n');
      error.isSandboxError = true;
    }
    return error;
  },
};
export default PuppetLauncher;

const defaultArgs = [
  '--disable-background-networking', // Disable various background network services, including extension updating,safe browsing service, upgrade detector, translate, UMA
  '--enable-features=NetworkService,NetworkServiceInProcess',
  '--disable-background-timer-throttling', // Disable timers being throttled in background pages/tabs
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad', // Disable crashdump collection (reporting is already disabled in Chromium)
  '--disable-client-side-phishing-detection', //  Disables client-side phishing detection.
  '--disable-domain-reliability', // Disables Domain Reliability Monitoring, which tracks whether the browser has difficulty contacting Google-owned sites and uploads reports to Google.
  '--disable-component-extensions-with-background-pages', // Disable some built-in extensions that aren't affected by --disable-extensions
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
  '--enable-logging',

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
  '--remote-debugging-pipe', // more secure than using protocol over a websocket

  '--password-store=basic', // Avoid potential instability of using Gnome Keyring or KDE wallet.
  '--use-mock-keychain', // Use mock keychain on Mac to prevent blocking permissions dialogs
  '--ignore-certificate-errors',
  '--allow-running-insecure-content',

  // don't leak private ip
  '--force-webrtc-ip-handling-policy=default_public_interface_only',
  // Use proxy for localhost URLs
  '--proxy-bypass-list=<-loopback>',
  '--no-startup-window',
];
