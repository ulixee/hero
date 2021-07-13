import * as Path from 'path';
import * as os from 'os';
import BrowserEngine from '@secret-agent/plugin-utils/lib/BrowserEngine';

let sessionDirCounter = 0;

export function configureBrowserLaunchArgs(
  engine: BrowserEngine,
  options: {
    showBrowser?: boolean;
    disableGpu?: boolean;
    disableDevtools?: boolean;
  },
): void {
  engine.launchArguments.push(
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
  );

  if (options.showBrowser) {
    const dataDir = Path.join(
      os.tmpdir(),
      engine.fullVersion.replace('.', '-'),
      `${String(Date.now()).substr(0, 10)}-${(sessionDirCounter += 1)}`,
    );
    engine.launchArguments.push(`--user-data-dir=${dataDir}`); // required to allow multiple browsers to be headed

    if (!options.disableDevtools) engine.launchArguments.push('--auto-open-devtools-for-tabs');
  } else {
    engine.launchArguments.push(
      '--hide-scrollbars',
      '--mute-audio',
      '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4', // adds cursor to headless linux
    );
  }

  if (options.disableGpu === true) {
    engine.launchArguments.push('--disable-gpu', '--disable-software-rasterizer');
    const idx = engine.launchArguments.indexOf('--use-gl=any');
    if (idx >= 0) engine.launchArguments.splice(idx, 1);
  }
}
