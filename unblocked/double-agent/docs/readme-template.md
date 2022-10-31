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

{{inject=output/collect-plugins.md}}

### Analyze Plugins

{{inject=output/analyze-plugins.md}}


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

## Setup Test Suite:

1. Modify [double-agent/stacks/data/external/userAgentConfig.json](stacks/data/external/userAgentConfig.json) to include browser ids you wish to test (`<browser.toLowercase()>-<major>-<minor ?? 0>`).
2. Run `yarn 2` to create a file called `userAgentsToTest.json` at `stacks/data/external/2-user-agents-to-test`. This file contains all the user agents that DoubleAgent should test. Grow or shrink this list based on how long you are willing to spend testing ;)
3. Setup your SSL Certificates and Host File entries (follow directions [here](collect/servers/Certs.ts)). `Why? DoubleAgent uses cross domain requests and https domains, so your local setup needs to be able to process these.`

## Testing your Scraper:

This project leverages yarn workspaces. To get started, first run `yarn` from the root directory.

`` NOTE: You should start with the `Setup Test Suite` step. ``

You'll test your scraper from the "Stacks" directory. A server called "collect-controller" creates all the ["assignments"](collect-controller/interfaces/IAssignment.ts) that your scraper should run. Each assignment includes a UserAgent (OS + Browser) and a series of pages to click, navigate through.

To start a `collect-controller`:

1. Run `yarn start` from the DoubleAgent repo.

- The API will return assignments one at a time until all tests have been run. Include a scraper engine you're testing with
  a query string or header called "scraper".

2. Run a "stack" to automatically click through all of the assignments. You can mimic the [Puppeteer](stacks/lib/PuppeteerRunnerFactory.ts) or [Unblocked](stacks/lib/UnblockedRunnerFactory.ts) classes and corresponding Runner classes with your own scraper.

`yarn 3` runs Unblocked Agent.
`yarn 3-puppeteer` runs Puppeteer.

- If you are operating in a different language, you can see the flow of assignments in the [AssignmentRunner](runner/lib/AssignmentRunner.ts) and [AssignmentsClient](runner/lib/AssignmentsClient.ts) classes.
- Behind the scenes of the runner class, when you create a new Test suite, you tell the server where to point to your `userAgentsToTest.json` file that you generated during the Setup step above (eg, `stacks/data/external/2-user-agents-to-test/userAgentsToTest.json`).

3. As tests run, you will see "profiles" of your raw data downloaded into `stacks/data/external/3-assignments/`.
4. After all tests are run, you can run `yarn 4` to generate `probe-ids` from all your profiles and compare them to real browser `probe-ids`. Under the `stacks/data/external/4-assignment-results`, any entries in the `-signature` files are signatures that differed from the probeId. The corresponding file contains the test details of the failed tests.

- NOTE: currently, these results are optimized for display on version 2 of the Scraper Report website. If you would like to submit a pull request to display differences in a human readable format, it would be tremendously appreciated!!
