import * as Fs from 'fs';
import Queue from 'p-queue';
import { By, until, Builder, Capabilities, WebDriver } from 'selenium-webdriver';
import Axios from 'axios';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import * as http from 'http';
import { createServer } from 'http';
import * as BrowserStack from 'browserstack-local';
import { createOsId, createOsVersion } from '../lib/OsUtils';
import { getDataFilePath } from '../lib/paths';

const userAgentsPath = getDataFilePath('external-raw/browserstack/userAgents.json');

const drivers = new Set<WebDriver>();
const port = 8099;
const userAgentsData = JSON.parse(Fs.readFileSync(userAgentsPath, 'utf8'));
const userAgentsIds: Set<string> = new Set(userAgentsData.map(x => x.id));

let isStopping = false;
ShutdownHandler.register(() => {
  isStopping = true;
  return Promise.allSettled([...drivers].map(x => x.quit()));
});

export default async function importBrowserstackUserAgents(): Promise<void> {
  const browserStack = await createBrowserStackTunnel();
  const server = await createTestServer();
  const queue = new Queue({ concurrency: 5 });

  const capabilities = await Axios.get('https://api.browserstack.com/automate/browsers.json', {
    auth: {
      username: process.env.BROWSERSTACK_USER,
      password: process.env.BROWSERSTACK_ACCESS_KEY,
    },
  }).then(x => x.data.filter(capability => !capability.real_mobile));

  const todoList: { osId: string; id: string; capability: any }[] = [];

  for (let i = 0; i < capabilities.length; i += 1) {
    const capability = capabilities[i];
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { browser, browser_version, os, os_version } = capability;
    if (browser_version.includes('beta') || os_version.includes('beta')) continue;

    if (browser === 'chrome' && parseFloat(browser_version) <= 120) continue;
    if (browser === 'firefox' && parseFloat(browser_version) < 68) continue;
    if (browser === 'safari' && parseFloat(browser_version) < 11) continue;
    if (browser === 'opera') continue; // can't get opera to work with selenium
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
    const osId = createOsId({ name: osName, version: createOsVersion(osName, osVersion, null) });
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
    new Promise<void>(resolve => browserStack.stop(resolve)),
  ]);
  server.close();
}

async function getRunnerForAgent(
  agent: { browserName: string; browser_version: string; os: string; os_version: string },
  osId: string,
  id: string,
  i: number,
): Promise<void> {
  if (isStopping) return;
  const capabilities: Capabilities & any = {
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

  let driver: WebDriver;
  try {
    console.log(
      `${i} - Running ${agent.browserName} ${agent.browser_version} on ${agent.os} ${agent.os_version}`,
    );
    driver = await new Builder()
      .usingServer('https://hub.browserstack.com/wd/hub')
      .withCapabilities(capabilities)
      .build();
    drivers.add(driver);

    await driver.get(`http://localhost:${port}`);
    console.log(`${i} - loaded url`);

    const body = await driver.wait(until.elementLocated(By.css('#userAgent')), 10e3);
    const useragent = await driver.wait(until.elementIsVisible(body)).getText();

    userAgentsData.push({ id, string: useragent, osId });

    console.log(`${i} - USERAGENT: `, useragent);
  } catch (error) {
    console.error('ERROR getting useragent for profile', agent, error);
  } finally {
    drivers.delete(driver);
    if (driver) {
      await driver.quit();
    }
  }
}

async function createBrowserStackTunnel(): Promise<BrowserStack.Local> {
  const browserStack = new BrowserStack.Local();
  console.log(`ESTABLISHING BROWSERSTACK TUNNEL`);
  const didStart = await new Promise<Error | null>(resolve =>
    browserStack.start({ key: process.env.BROWSERSTACK_ACCESS_KEY }, resolve),
  );
  ShutdownHandler.register(() => new Promise<void>(resolve => browserStack.stop(resolve)));
  console.log('ESTABLISHED BrowserStackLocal', { startError: didStart });
  return browserStack;
}

async function createTestServer(): Promise<http.Server> {
  const server = createServer((req, res) => {
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
  await new Promise<void>(resolve => server.listen(port, resolve));
  ShutdownHandler.register(() => new Promise(resolve => server.close(resolve)));
  return server;
}

function titleize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
