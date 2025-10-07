import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import { defaultScreen } from '../Viewports';

export function configureBrowserLaunchArgs(
  engine: IBrowserEngine,
  options: {
    showChrome?: boolean;
    disableGpu?: boolean;
    showDevtools?: boolean;
  },
): void {
  engine.launchArguments.push(
    '--disable-background-timer-throttling', // Disable timers being throttled in background pages/tabs
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad', // Disable crashdump collection (reporting is already disabled in Chromium)
    '--disable-client-side-phishing-detection', //  Disables client-side phishing detection.
    '--disable-domain-reliability', // Disables Domain Reliability Monitoring, which tracks whether the browser has difficulty contacting Google-owned sites and uploads reports to Google.
    '--disable-default-apps', // Disable installation of default apps on first run
    '--disable-dev-shm-usage', // https://github.com/GoogleChrome/puppeteer/issues/1834
    '--disable-extensions', // Disable all chrome extensions.
    '--disable-features=AimEnabled', // disable AIM Server Eligibility (this does extra network requests)
    '--disable-features=PaintHolding', // Don't defer paint commits (normally used to avoid flash of unstyled content)
    '--disable-features=LazyFrameLoading',
    '--disable-features=DestroyProfileOnBrowserClose', // Disable the feature of: Destroy profiles when their last browser window is closed, instead of when the browser exits.
    '--disable-features=AvoidUnnecessaryBeforeUnloadCheckSync', // allow about:blank nav - If enabled, this feature results in the browser process only asking the renderer process to run beforeunload handlers if it knows such handlers are registered. With kAvoidUnnecessaryBeforeUnloadCheckSync, content does not report a beforeunload handler is present. A ramification of this is navigations that would normally check beforeunload handlers before continuing will not, and navigation will synchronously continue.
    '--disable-features=GlobalMediaControls', // Hide toolbar button that opens dialog for controlling media sessions.
    '--disable-features=MediaRouter', // don't lookup local area casting options - stops network permission prompt
    '--disable-features=DialMediaRouteProvider', // don't lookup local area casting options)
    '--disable-features=OptimizationHints', // Disable the Chrome Optimization Guide and networking with its service API
    '--disable-features=AutofillServerCommunication', //  Disables autofill server communication
    '--disable-blink-features=AutomationControlled',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection', // Some javascript functions can be used to flood the browser process with IPC. By default, protection is on to limit the number of IPC sent to 10 per second per frame.
    '--disable-prompt-on-repost', // Reloading a page that came from a POST normally prompts the user.
    '--disable-renderer-backgrounding', // This disables non-foreground tabs from getting a lower process priority This doesn't (on its own) affect timers or painting behavior. karma-chrome-launcher#123
    '--disable-sync', // Disable syncing to a Google account

    '--no-service-autorun', // Disables the service process from adding itself as an autorun process. This does not delete existing autorun registrations, it just prevents the service from registering a new one.
    '--force-color-profile=srgb', // Force all monitors to be treated as though they have the specified color profile.

    '--use-fake-device-for-media-stream',
    '--disable-search-engine-choice-screen', // Disable the default search engine prompt
    '--no-default-browser-check', //  Disable the default browser check, do not prompt to set it as such
    '--metrics-recording-only', // Disable reporting to UMA, but allows for collection
    '--no-first-run', // Skip first run wizards

    // '--enable-automation', BAB - disable because adds infobar, stops auto-reload on network errors (using other flags)
    '--enable-auto-reload', // Enable auto-reload of error pages.

    '--password-store=basic', // Avoid potential instability of using Gnome Keyring or KDE wallet.
    '--allow-running-insecure-content',

    `--window-size=${defaultScreen.width},${defaultScreen.height}`,

    // don't leak private ip
    '--force-webrtc-ip-handling-policy=default_public_interface_only',
    '--no-startup-window',
  );

  if (options.showChrome) {
    if (options.showDevtools) engine.launchArguments.push('--auto-open-devtools-for-tabs');
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
