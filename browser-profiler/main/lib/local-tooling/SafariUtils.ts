import { exec, spawn } from 'child_process';

let browser: any;

export async function startSafariAndLoadUrl(url: string): Promise<void> {
  if (browser) throw new Error('Safari already started');

  const command = `/Applications/Safari.app/Contents/MacOS/Safari`;
  console.log(command);
  browser = spawn(command, { shell: true, stdio: 'pipe' });
  process.on('exit', () => stopSafari());
  process.on('SIGTERM', () => stopSafari());
  browser.stderr.setEncoding('utf8');
  browser.stdout.setEncoding('utf8');
  browser.stderr.pipe(process.stderr);
  browser.stdout.pipe(process.stdout);
  await new Promise<void>(resolve => setTimeout(resolve, 5e3));
  exec(`osascript -e 'tell application "Safari" to open location "${url}"'`, error => {
    if (error) console.log('ERROR: ', error);
  });
}

export async function stopSafari(): Promise<void> {
  if (browser) {
    await browser.kill();
    await new Promise<void>(resolve => setTimeout(resolve, 1e3));
    browser = undefined;
  }
}

export async function startWebKitAndLoadUrl(url: string): Promise<void> {
  // @ts-ignore - not included right now
  // eslint-disable-next-line import/no-unresolved
  const { webkit } = require('playwright');
  browser = await webkit.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
}

export async function stopWebkit(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = undefined;
  }
}
