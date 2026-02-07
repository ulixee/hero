"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSafariAndLoadUrl = startSafariAndLoadUrl;
exports.stopSafari = stopSafari;
exports.startWebKitAndLoadUrl = startWebKitAndLoadUrl;
exports.stopWebkit = stopWebkit;
const child_process_1 = require("child_process");
let browser;
async function startSafariAndLoadUrl(url) {
    if (browser)
        throw new Error('Safari already started');
    const command = `/Applications/Safari.app/Contents/MacOS/Safari`;
    console.log(command);
    browser = (0, child_process_1.spawn)(command, { shell: true, stdio: 'pipe' });
    process.on('exit', () => stopSafari());
    process.on('SIGTERM', () => stopSafari());
    browser.stderr.setEncoding('utf8');
    browser.stdout.setEncoding('utf8');
    browser.stderr.pipe(process.stderr);
    browser.stdout.pipe(process.stdout);
    await new Promise(resolve => setTimeout(resolve, 5e3));
    (0, child_process_1.exec)(`osascript -e 'tell application "Safari" to open location "${url}"'`, error => {
        if (error)
            console.log('ERROR: ', error);
    });
}
async function stopSafari() {
    if (browser) {
        await browser.kill();
        await new Promise(resolve => setTimeout(resolve, 1e3));
        browser = undefined;
    }
}
async function startWebKitAndLoadUrl(url) {
    // @ts-ignore - not included right now
    // eslint-disable-next-line import/no-unresolved
    const { webkit } = require('playwright');
    browser = await webkit.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
}
async function stopWebkit() {
    if (browser) {
        await browser.close();
        browser = undefined;
    }
}
//# sourceMappingURL=SafariUtils.js.map