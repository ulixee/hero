"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChromeDownloadUrlForLinux = getChromeDownloadUrlForLinux;
exports.startChromeAndLoadUrl = startChromeAndLoadUrl;
exports.stopChrome = stopChrome;
exports.getChromeExecutablePath = getChromeExecutablePath;
exports.installChrome = installChrome;
exports.navigateDevtoolsToUrl = navigateDevtoolsToUrl;
const child_process_1 = require("child_process");
const ChromeLauncher = require("chrome-launcher");
const CDP = require("chrome-remote-interface");
const chrome_app_1 = require("@ulixee/chrome-app");
let chromeProcess;
function getChromeDownloadUrlForLinux(fullVersion) {
    return `https://github.com/ulixee/chrome-versions/releases/download/${fullVersion}/chrome_${fullVersion}_linux.tar.gz`;
}
let counter = 0;
async function startChromeAndLoadUrl(executablePath, url, headType, automationType, majorVersion) {
    if (chromeProcess)
        throw new Error('Chrome already started');
    const chromeFlags = [
        '--disable-gpu',
        '--allow-running-insecure-content',
        '--ignore-certificate-errors',
        '--no-default-browser-check',
        '--no-first-run',
        '--use-mock-keychain',
        '--disable-features=MediaRouter,DialMediaRouteProvider', // remove chrome window prompt
        `--user-data-dir=/tmp/${Date.now()}-${(counter += 1)}`,
    ];
    if (headType === 'headless') {
        if (majorVersion >= 109) {
            chromeFlags.push('--headless=new');
        }
        else {
            chromeFlags.push('--headless');
        }
    }
    if (automationType === 'devtools') {
        const chrome = await launchLocalDevtoolsChrome(executablePath, chromeFlags);
        await navigateDevtoolsToUrl(url, chrome.port);
    }
    else {
        const command = `"${executablePath}" ${chromeFlags.join(' ')} "${url}"`;
        console.log('starting', command);
        chromeProcess = (0, child_process_1.spawn)(command, { shell: true }); // , stdio: 'pipe'
        chromeProcess.on('error', error => console.log('CHROME PROCESS ERROR: ', error));
        process.on('exit', () => stopChrome());
        process.on('SIGTERM', () => stopChrome());
        chromeProcess.stderr.setEncoding('utf8');
        chromeProcess.stdout.setEncoding('utf8');
        chromeProcess.stderr.pipe(process.stderr);
        chromeProcess.stdout.pipe(process.stdout);
    }
}
async function stopChrome() {
    if (chromeProcess) {
        await chromeProcess.kill();
        await new Promise(resolve => setTimeout(resolve, 1e3));
        chromeProcess = undefined;
    }
}
function getChromeExecutablePath(fullVersion) {
    return new chrome_app_1.default(fullVersion).executablePath;
}
function installChrome(fullVersion) {
    return new chrome_app_1.default(fullVersion).install();
}
// INTERNAL /////////
async function launchLocalDevtoolsChrome(chromePath, chromeFlags) {
    const launchedProcess = await ChromeLauncher.launch({
        chromePath,
        chromeFlags: [...chromeFlags, '--enable-automation'],
        ignoreDefaultFlags: true,
        logLevel: 'verbose',
    });
    chromeProcess = launchedProcess.process;
    return launchedProcess;
}
async function connect(port, retries = 5) {
    try {
        return await CDP({ port });
    }
    catch (err) {
        if (retries <= 0)
            throw err;
        console.log(`Retrying on port ${port}`);
        await new Promise(resolve => setTimeout(resolve, 1e3));
        return connect(port, retries - 1);
    }
}
async function navigateDevtoolsToUrl(url, developerToolsPort) {
    let client;
    try {
        client = await connect(developerToolsPort);
        console.log('Connected to chrome devtools (%s)', developerToolsPort);
        const { Network, Page, Runtime, Log } = client;
        await Network.enable();
        const shouldLogConsole = process.env.DOM_CONSOLE === '1' || process.env.DOM_EXTRACTOR_DEBUG === '1';
        if (shouldLogConsole) {
            await Runtime.enable();
            await Log.enable();
            Runtime.consoleAPICalled(event => {
                const args = (event.args || [])
                    .map(x => x.value ?? x.description ?? x.type)
                    .join(' ');
                console.log(`[chrome-console] ${event.type}: ${args}`);
            });
            Runtime.exceptionThrown(event => {
                const details = event.exceptionDetails;
                const desc = details.exception?.description ?? details.text;
                console.log(`[chrome-exception] ${desc}`);
            });
            Log.entryAdded(event => {
                console.log(`[chrome-log] ${event.entry.level}: ${event.entry.text}`);
            });
        }
        await Page.enable();
        await Page.navigate({ url });
        // Close the client after page load (or timeout) to avoid leaking connections.
        await Promise.race([
            Page.loadEventFired(),
            new Promise(resolve => setTimeout(resolve, 5_000)),
        ]);
    }
    catch (err) {
        console.error('DEVTOOLS ERROR: ', err);
    }
    finally {
        if (client) {
            await client.close();
        }
    }
}
//# sourceMappingURL=ChromeUtils.js.map