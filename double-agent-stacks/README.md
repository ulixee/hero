# DoubleAgent Stacks
This project has reference implementations of testing a scraper stack using the [DoubleAgent][../double-agent] suite of tests.

## Setup Test Suite:

1. Modify [external/userAgentConfig.json](./data/external/userAgentConfig.json) to include browser ids you wish to test (`<browser.toLowercase()>-<major>-<minor ?? 0>`).
2. Run `yarn 2` to create a file called `userAgentsToTest.json` at `.data/external/2-user-agents-to-test`. This file contains all the user agents that DoubleAgent should test. Grow or shrink this list based on how long you are willing to spend testing ;)
3. Setup your DoubleAgent SSL Certificates and Host File entries (follow directions in the code [here](../double-agent/collect/servers/Certs.ts#L10)).
   - **Why?** DoubleAgent uses cross domain requests and https domains, so your local setup needs to be able to process these.

## Testing your Scraper:

This project leverages yarn workspaces. To get started, first run `yarn build` from the root directory.

`` NOTE: You should start with the `Setup Test Suite` step. ``

You'll test your scraper from the "Stacks" directory. A server called "collect-controller" creates all the ["assignments"](../double-agent/collect-controller/interfaces/IAssignment.ts) that your scraper should run. Each assignment includes a UserAgent (OS + Browser) and a series of pages to click, navigate through.

To start a `collect-controller`:

1. Run `yarn start` from the DoubleAgent repo.

- The API will return assignments one at a time until all tests have been run. Include a scraper engine you're testing with
  a query string or header called "scraper".

2. Run a "stack" to automatically click through all of the assignments. You can mimic the [Puppeteer](./lib/PuppeteerRunnerFactory.ts) or [Unblocked](./lib/UnblockedRunnerFactory.ts) classes and corresponding Runner classes with your own scraper.

`yarn 3` runs Unblocked Agent.
`yarn 3-puppeteer` runs Puppeteer.

- If you are operating in a different language, you can see the flow of assignments in the [AssignmentRunner](../double-agent/runner/lib/AssignmentRunner.ts) and [AssignmentsClient](../double-agent/runner/lib/AssignmentsClient.ts) classes.
- Behind the scenes of the runner class, when you create a new Test suite, you tell the server where to point to your `userAgentsToTest.json` file that you generated during the Setup step above (eg, `./data/external/2-user-agents-to-test/userAgentsToTest.json`).

3. As tests run, you will see "profiles" of your raw data downloaded into `./data/external/3-assignments/`.
4. After all tests are run, you can run `yarn 4` to generate `probe-ids` from all your profiles and compare them to real browser `probe-ids`. Under the `./data/external/4-assignment-results`, any entries in the `-signature` files are signatures that differed from the probeId. The corresponding file contains the test details of the failed tests.

- NOTE: currently, these results are optimized for display on version 2 of the Scraper Report website. If you would like to submit a pull request to display differences in a human readable format, it would be tremendously appreciated!!
