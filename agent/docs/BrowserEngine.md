# BrowserEngine

A BrowserEngine is a configuration to launch a Chrome process, including the executable location and the launch arguments.

## IBrowserEngine

- name `string` The browser name (ie, chrome)
- fullVersion `string` The full version string (eg, `98.0.4758.102`)
- executablePath `string` The path to the executable.
- executablePathEnvVar `string` An environment variable to check for the executable path (sometimes overridden in a Docker-like env).
- launchArguments `string[]` A list of command line startup arguments for Chrome.
- isInstalled `boolean` Is the executable (or env variable) present on the host machine.
- userDataDir `string`. Optional directory to put user configs.
- doesBrowserAnimateScrolling `boolean` Does the Browser attempt to convert scroll commands into many scroll increments - Chrome 91+ does this.
- verifyLaunchable() `Promise<any>` Optional function that checks if this engine has all prerequisites installed. ChromeApps from [Browser Vault](https://github.com/ulixee/chrome-versions) support this function on Linux.

# ChromeEngine

ChromeEngine is a wrapper that can load Chrome versions from the [Browser Vault](https://github.com/ulixee/chrome-versions) project. These are Chrome versions with auto-updater turned off.

The ChromeEngine wrapper makes an IBrowserEngine "writeable" so you can modify launch arguments.

```js
const { Agent } = require('@ulixee/unblocked-agent');
const ChromeEngine = require('@ulixee/unblocked-agent/lib/ChromeEngine');
const Chrome100 = require('@ulixee/chrome-100-0');

const agent = new Agent({
  browserEngine: ChromeEngine.fromPackageName('@ulixee/chrome-100-0'),
});

// use chrome 100
```
