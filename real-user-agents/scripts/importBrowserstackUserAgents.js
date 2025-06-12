"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = importBrowserstackUserAgents;
const Fs = require("fs");
const p_queue_1 = require("p-queue");
const selenium_webdriver_1 = require("selenium-webdriver");
const axios_1 = require("axios");
const ShutdownHandler_1 = require("@ulixee/commons/lib/ShutdownHandler");
const http_1 = require("http");
const BrowserStack = require("browserstack-local");
const OsUtils_1 = require("../lib/OsUtils");
const paths_1 = require("../lib/paths");
const userAgentsPath = (0, paths_1.getDataFilePath)('external-raw/browserstack/userAgents.json');
const drivers = new Set();
const port = 8099;
const userAgentsData = JSON.parse(Fs.readFileSync(userAgentsPath, 'utf8'));
const userAgentsIds = new Set(userAgentsData.map(x => x.id));
let isStopping = false;
ShutdownHandler_1.default.register(() => {
    isStopping = true;
    return Promise.allSettled([...drivers].map(x => x.quit()));
});
async function importBrowserstackUserAgents() {
    const browserStack = await createBrowserStackTunnel();
    const server = await createTestServer();
    const queue = new p_queue_1.default({ concurrency: 5 });
    const capabilities = await axios_1.default.get('https://api.browserstack.com/automate/browsers.json', {
        auth: {
            username: process.env.BROWSERSTACK_USER,
            password: process.env.BROWSERSTACK_ACCESS_KEY,
        },
    }).then(x => x.data.filter(capability => !capability.real_mobile));
    const todoList = [];
    for (let i = 0; i < capabilities.length; i += 1) {
        const capability = capabilities[i];
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { browser, browser_version, os, os_version } = capability;
        if (browser_version.includes('beta') || os_version.includes('beta'))
            continue;
        if (browser === 'chrome' && parseFloat(browser_version) <= 120)
            continue;
        if (browser === 'firefox' && parseFloat(browser_version) < 68)
            continue;
        if (browser === 'safari' && parseFloat(browser_version) < 11)
            continue;
        if (browser === 'opera')
            continue; // can't get opera to work with selenium
        console.log({ browser, browser_version });
        capability.browserName = titleize(browser);
        const id = `${capability.browserName}-${browser_version}--${os}-${os_version}`;
        if (userAgentsIds.has(id)) {
            // console.log(
            //   `${i} - FOUND ${capability.browserName} ${browser_version} on ${os} ${os_version}`,
            // );
            continue;
        }
        userAgentsIds.add(id);
        // NOTE: we need to create the correct OS id here because some browsers started capping the OS version sent in the
        // user agent - particularly mac 10_15_7 (https://chromestatus.com/feature/5452592194781184)
        const [osFromId, osVersion] = id.split('--').pop().split('-');
        const osName = osFromId === 'OS X' ? 'Mac OS' : 'Windows';
        const osId = (0, OsUtils_1.createOsId)({ name: osName, version: (0, OsUtils_1.createOsVersion)(osName, osVersion, null) });
        todoList.push({ osId, id, capability });
    }
    console.log(`TOTAL OF ${capabilities.length} browsers. ${todoList.length} need Processing.`);
    console.log('---------------------');
    for (let i = 0; i < todoList.length; i += 1) {
        const { capability, osId, id } = todoList[i];
        void queue.add(() => getRunnerForAgent(capability, osId, id, i));
    }
    await queue.onIdle();
    await queue.onEmpty();
    Fs.writeFileSync(userAgentsPath, JSON.stringify(userAgentsData, null, 2));
    console.log('---------------------');
    console.log(`FINISHED ${todoList.length} browsers`);
    setTimeout(() => process.exit(), 10e3).unref();
    await Promise.allSettled([
        ...[...drivers].map(x => x.quit()),
        drivers.clear(),
        new Promise(resolve => browserStack.stop(resolve)),
    ]);
    server.close();
}
async function getRunnerForAgent(agent, osId, id, i) {
    if (isStopping)
        return;
    const capabilities = {
        browserName: agent.browserName,
        browserVersion: agent.browser_version,
        'bstack:options': {
            os: agent.os,
            osVersion: agent.os_version,
            buildName: 'UserAgentBuilder',
            projectName: 'Real User Agents',
            local: 'true',
            userName: process.env.BROWSERSTACK_USER,
            accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        },
        acceptSslCert: true,
    };
    let driver;
    try {
        console.log(`${i} - Running ${agent.browserName} ${agent.browser_version} on ${agent.os} ${agent.os_version}`);
        driver = await new selenium_webdriver_1.Builder()
            .usingServer('https://hub.browserstack.com/wd/hub')
            .withCapabilities(capabilities)
            .build();
        drivers.add(driver);
        await driver.get(`http://localhost:${port}`);
        console.log(`${i} - loaded url`);
        const body = await driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css('#userAgent')), 10e3);
        const useragent = await driver.wait(selenium_webdriver_1.until.elementIsVisible(body)).getText();
        userAgentsData.push({ id, string: useragent, osId });
        console.log(`${i} - USERAGENT: `, useragent);
    }
    catch (error) {
        console.error('ERROR getting useragent for profile', agent, error);
    }
    finally {
        drivers.delete(driver);
        if (driver) {
            await driver.quit();
        }
    }
}
async function createBrowserStackTunnel() {
    const browserStack = new BrowserStack.Local();
    console.log(`ESTABLISHING BROWSERSTACK TUNNEL`);
    const didStart = await new Promise(resolve => browserStack.start({ key: process.env.BROWSERSTACK_ACCESS_KEY }, resolve));
    ShutdownHandler_1.default.register(() => new Promise(resolve => browserStack.stop(resolve)));
    console.log('ESTABLISHED BrowserStackLocal', { startError: didStart });
    return browserStack;
}
async function createTestServer() {
    const server = (0, http_1.createServer)((req, res) => {
        const userAgentString = req.headers['user-agent'];
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
      <div id="userAgent">${userAgentString}</div>
      <div id="platform"></div>
      <div id="buildID"></div>
      <script>
      document.querySelector('#platform').innerText = window.navigator.platform;
      document.querySelector('#buildID').innerText = window.navigator.buildID;
      </script>
    `);
    });
    await new Promise(resolve => server.listen(port, resolve));
    ShutdownHandler_1.default.register(() => new Promise(resolve => server.close(resolve)));
    return server;
}
function titleize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
//# sourceMappingURL=importBrowserstackUserAgents.js.map