import { ChildProcess, spawn } from 'child_process';
import * as ChromeLauncher from 'chrome-launcher';
import { LaunchedChrome } from 'chrome-launcher';
import * as CDP from 'chrome-remote-interface';
import ChromeApp from '@ulixee/chrome-app';

let chromeProcess: ChildProcess;

export function getChromeDownloadUrlForLinux(fullVersion: string): string {
  return `https://github.com/ulixee/chrome-versions/releases/download/${fullVersion}/chrome_${fullVersion}_linux.tar.gz`;
}

export async function startChromeAndLoadUrl(
  executablePath: string,
  url: string,
  headType: string,
  automationType: string,
  majorVersion: number
): Promise<void> {
  if (chromeProcess) throw new Error('Chrome already started');

  const chromeFlags = [
    '--disable-gpu',
    '--allow-running-insecure-content',
    '--ignore-certificate-errors',
    '--no-default-browser-check',
    '--no-first-run',
    '--use-mock-keychain',
  ];
  if (headType === 'headless') {
    if (majorVersion >= 109) {
      chromeFlags.push('--headless=new');
    } else {
      chromeFlags.push('--headless');
    }
  }

  if (automationType === 'devtools') {
    const chrome = await launchLocalDevtoolsChrome(executablePath, chromeFlags);
    await navigateDevtoolsToUrl(url, chrome.port);
  } else {
    const command = `"${executablePath}" ${chromeFlags.join(' ')} "${url}"`;
    console.log('starting', command);
    chromeProcess = spawn(command, { shell: true }); // , stdio: 'pipe'
    chromeProcess.on('error', error => console.log('CHROME PROCESS ERROR: ', error));
    process.on('exit', () => stopChrome());
    process.on('SIGTERM', () => stopChrome());
    chromeProcess.stderr.setEncoding('utf8');
    chromeProcess.stdout.setEncoding('utf8');
    chromeProcess.stderr.pipe(process.stderr);
    chromeProcess.stdout.pipe(process.stdout);
  }
}

export async function stopChrome(): Promise<void> {
  if (chromeProcess) {
    await chromeProcess.kill();
    await new Promise(resolve => setTimeout(resolve, 1e3));
    chromeProcess = undefined;
  }
}

export function getChromeExecutablePath(fullVersion: string): string {
  return new ChromeApp(fullVersion).executablePath;
}

export function installChrome(fullVersion: string): Promise<void> {
  return new ChromeApp(fullVersion).install();
}

// INTERNAL /////////

async function launchLocalDevtoolsChrome(
  chromePath: string,
  chromeFlags: string[],
): Promise<LaunchedChrome> {
  const launchedProcess = await ChromeLauncher.launch({
    chromePath,
    chromeFlags: [...chromeFlags, '--enable-automation'],
    ignoreDefaultFlags: true,
    logLevel: 'verbose',
  });
  chromeProcess = launchedProcess.process;
  return launchedProcess;
}

async function connect(port: number, retries = 5): Promise<CDP> {
  try {
    return await CDP({ port });
  } catch (err) {
    if (retries <= 0) throw err;
    console.log(`Retrying on port ${port}`);
    await new Promise(resolve => setTimeout(resolve, 1e3));
    return connect(port, retries - 1);
  }
}

export async function navigateDevtoolsToUrl(
  url: string,
  developerToolsPort: number,
): Promise<void> {
  let client;
  try {
    client = await connect(developerToolsPort);
    console.log('Connected to chrome devtools (%s)', developerToolsPort);
    const { Network, Page } = client;
    await Network.enable();
    await Page.enable();
    await Page.navigate({ url });
  } catch (err) {
    console.error('DEVTOOLS ERROR: ', err);
  } finally {
    if (client) {
      await client.close();
    }
  }
}
