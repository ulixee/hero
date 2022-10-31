Double Agent is a suite of tools written to allow a scraper engine to test if it is detectable when trying to blend into the most common web traffic.

## Structure:

DoubleAgent has been organized into two main layers:

- `/collect`: scripts/plugins for collecting browser profiles. Each plugin generates a series of pages to test how a browser behaves.
- `/analyze`: scripts/plugins for analyzing browser profiles against verified profiles. Scraper results from `collect` are compared to legit "profiles" to find discrepancies. These checks are given a Looks Human"&trade; score, which indicates the likelihood that a scraper would be flagged as bot or human.

The easiest way to use `collect` is with the collect-controller:

- `/collect-controller`: a server that can generate step-by-step assignments for a scraper to run all tests

## Plugins

The bulk of the `collect` and `analyze` logic has been organized into what we call plugins.

### Collect Plugins

| Name                    | Description                                                                                      |
| ----------------------- | :----------------------------------------------------------------------------------------------- |
| browser-codecs          | Collects the audio, video and WebRTC codecs of the browser                                       |
| browser-dom-environment | Collects the browser's DOM environment such as object structure, class inheritance amd key order |
| browser-fingerprints    | Collects various browser attributes that can be used to fingerprint a given session              |
| browser-fonts           | Collects the fonts of the current browser/os.                                                    |
| browser-speech          | Collects browser speech synthesis voices                                                         |
| http-assets             | Collects the headers used when loading assets such as css, js, and images in a browser           |
| http-basic-headers      | Collects the headers sent by browser when requesting documents in various contexts               |
| http-ua-hints           | Collects User Agent hints for a browser                                                          |
| http-websockets         | Collects the headers used when initializing and facilitating web sockets                         |
| http-xhr                | Collects the headers used by browsers when facilitating XHR requests                             |
| http2-session           | Collects the settings, pings and frames sent across by a browser http2 client                    |
| tcp                     | Collects tcp packet values such as window-size and time-to-live                                  |
| tls-clienthello         | Collects the TLS clienthello handshake when initiating a secure connection                       |
| http-basic-cookies      | Collects a wide range of cookies configuration options and whether they're settable/gettable     |

### Analyze Plugins

| Name                    | Description                                                                                                                               |
| ----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| browser-codecs          | Analyzes that the audio, video and WebRTC codecs match the given user agent                                                               |
| browser-dom-environment | Analyzes the DOM environment, such as functionality and object structure, match the given user-agent                                      |
| browser-fingerprints    | Analyzes whether the browser's fingerprints leak across sessions                                                                          |
| http-assets             | Analyzes http header order, capitalization and default values for common document assets (images, fonts, media, scripts, stylesheet, etc) |
| http-basic-cookies      | Analyzes whether cookies are enabled correctly, including same-site and secure                                                            |
| http-basic-headers      | Analyzes header order, capitalization and default values                                                                                  |
| http-websockets         | Analyzes websocket upgrade request header order, capitalization and default values                                                        |
| http-xhr                | Analyzes header order, capitalization and default values of XHR requests                                                                  |
| http2-session           | Analyzes http2 session settings and frames                                                                                                |
| tcp                     | Analyzes tcp packet values, including window-size and time-to-live                                                                        |
| tls-clienthello         | Analyzes clienthello handshake signatures, including ciphers, extensions and version                                                      |

## Probes:

DoubleAgent operates off of the notion of "probes". Probes are checks or "tests" to reliably check a piece of information emitted by a browser. The `collect` phase of DoubleAgent gathers raw data from browsers running a series of tests. The `analyze` phase turns that raw data into "probes" using these patterns.

Each measured "signal" from a browser is stored as a `probe-id`, which is the raw output of the actual values emitted.

Probes are created during "Profile Generation", which will create all the possible `probe-ids`, along with which browsers and operating systems they correspond to. These are called "Probe Buckets". They're a tool to find overlap between the millions of signals browsers put out and reduce the noise when presenting the information.

```json
{
  "id": "aord-accv",
  "checkName": "ArrayOrderIndexCheck",
  "checkType": "Individual",
  "checkMeta": {
    "path": "headers:none:Document:host",
    "protocol": "http",
    "httpMethod": "GET"
  },
  "args": [
    [
      [],
      [
        "connection",
        "upgrade-insecure-requests",
        "user-agent",
        "accept",
        "accept-encoding",
        "accept-language",
        "cookie"
      ]
    ]
  ]
}
```

Probe ids for that pattern look like: `http:GET:headers:none:Document:host:ArrayOrderIndexCheck:;connection,upgrade-insecure-requests,user-agent,accept,accept-encoding,accept-language,cookie`. This probe id captures a bit about the test, as well as the measured signal from the browser.

## Updating the Probe "Sources"

Probes are generated from a baseline of browsers. Double Agent comes with some built-in profiles in [probe-data](./probe-data) based on the browsers [here](stacks/data/external/userAgentConfig.json). Double Agent is built to allow testing a single browser, or to generate a massive data set to see how well scrapers can emulate many browsers. As this is very time consuming, we tend to limit the tested browsers to the last couple versions of Chrome, which is what Unblocked Agent can currently emulate.

If you wish to generate probes for different data browsers (or a wider set), you can follow these steps to update the data:

1. Clone the [`unblocked-web/unblocked`](https://github.com/unblocked-web/unblocked) monorepo and install git submodules.
2. Download the `unblocked-web/browser-profiler` data by running `yarn downloadData` in that workspace folder.
3. Modify [double-agent/stacks/data/external/userAgentConfig.json](stacks/data/external/userAgentConfig.json) to include browser ids you wish to test (`<browser.toLowercase()>-<major>-<minor ?? 0>`).
4. Run `yarn 0` to copy in the profile data.
5. Run `yarn 1` to create new probes.

## Testing your Scraper:
To view examples of running the test suite with a custom browser, check-out the [DoubleAgent Stacks](https://github.com/unblocked-web/unblocked/double-agent-stacks) project in [Unblocked](https://github.com/unblocked-web/unblocked).
