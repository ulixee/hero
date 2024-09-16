# Browser Profiler

The Unblocked Browser Profiler is a set of techniques for measuring attributes of real browsers on real operating systems.

Browser Profiler builds profiles in two major ways:

1. BrowserStack: a service that provides real browsers on real operating systems (VMs). They have great open source support, so we generate profiles using their offered browsers.
2. Docker: runs Chrome headed and headless to determine attributes that differ when run as a true browser

This Profiler collects "profiles" by running the DoubleAgent collect routines for each combination of Browser and Operating System.

- `Main`: Generate full-blown DoubleAgent profiles as well as DOM-only profiles.
- `DomBridger`: Create various diffs when going from:
  - headed-to-headless: compares variables changing from headed to headless
  - local-to-browserstack: compares a headed local version to a headed browserstack version
  - instance variations: changes between runs like dates and urls
  - nodevtools-to-devtools: compares which variables rotate when turning on/off devtools
  
This project currently does two passes:
    1. Compare deep diffs of the browser dom for each of the above
    2. Attempt to extract "meaningful" changes into patterns. To control these, you can manipulate the `dom-bridger/lib/extractor` files.
        - In these files, you need to add "regexps" for anything you think applies to a given indicator. 
        - The rest of these indicators are used to generate `browser-profiler-data/dom-bridges/path-patterns` files. 

NOTE: The latter half of this approach is still in flux and needs work to improve the automation of extraction.  

# Updating

1. From double-agent, deploy & run the code on the server using (replace REMOTE with your ip):

- `$ REMOTE=174.138.36.46 ./deploy.sh`

2. Run Profiles (edit main/scripts/runBrowserstack.ts to run a single plugin):

- `$ yarn profile:browserstack`

3. Create Headed Dom Profiles

- `$ yarn profile:dom-browserstack`

4. Create Local Dom Profiles

- `$ yarn profile:dom-local`

5. Create Bridges. Examine output in `browser-profiler-data/dom-bridges/path-patterns` and `browser-profiler-data/dom-bridges/raw-mappings` to flag anything that should be ignored when generating emulators and running double agent.

- `$ yarn workspace @ulixee/unblocked-browser-profiler-dom-bridger generate`

1. Create Emulator Data (from ../browser-emulator-builder)

- `$ yarn workspace @ulixee/unblocked-browser-emulator-builder generate`

7. Commit data to Browser Profiler, Emulator Data, etc
