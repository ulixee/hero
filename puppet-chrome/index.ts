import Path from 'path';
import os from 'os';
import { ILaunchOptions } from './interfaces/ILaunchOptions';
import { Browser } from './lib/Browser';
import launchProcess from './process/launchProcess';

export default async function launch(options: ILaunchOptions): Promise<Browser> {
  const chromeArguments = [
    '--disable-background-networking',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-features=TranslateUI,site-per-process',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--disable-gpu',

    '--force-color-profile=srgb',
    '--use-gl=swiftshader-webgl',
    '--use-gl=swiftshader',
    '--use-gl=osmesa',

    '--metrics-recording-only',
    '--no-first-run',

    '--enable-automation',
    '--remote-debugging-pipe',

    '--password-store=basic',
    '--use-mock-keychain',
    '--ignore-certificate-errors',
    '--allow-running-insecure-content',

    '--lang=en-US,en;q=0.9',
    '--window-size=1920,1080',
    '--window-position=0,0',

    // don't leak private ip
    '--force-webrtc-ip-handling-policy=default_public_interface_only',
    // Use proxy for localhost URLs
    '--proxy-bypass-list=<-loopback>',
    '--no-startup-window',
  ];

  if (!options.showBrowser) {
    chromeArguments.push('--headless', '--hide-scrollbars', '--mute-audio');
  } else {
    chromeArguments.push('--auto-open-devtools-for-tabs');
  }

  if (options.proxyPort !== undefined) {
    chromeArguments.push(`--proxy-server=localhost:${options.proxyPort}`);
  }

  const temporaryUserDataDir = Path.join(os.tmpdir(), 'core-engine');
  chromeArguments.push(`--user-data-dir=${temporaryUserDataDir}`);

  const { connection, close } = launchProcess(chromeArguments, temporaryUserDataDir, options);

  try {
    const browser = await Browser.create(connection, close);
    // TODO: do we need to wait for first target?
    return browser;
  } catch (error) {
    close();
    throw error;
  }
}
