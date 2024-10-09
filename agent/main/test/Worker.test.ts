import { BrowserUtils, TestLogger } from '@ulixee/unblocked-agent-testing';
import { TestServer } from './server';
import { Browser, BrowserContext, Page } from '../index';

describe('Worker test', () => {
  let server: TestServer;
  let httpsServer: TestServer;
  let page: Page;
  let browser: Browser;
  let context: BrowserContext;

  beforeAll(async () => {
    server = await TestServer.create(0);
    httpsServer = await TestServer.createHTTPS(0);
    browser = BrowserUtils.createDefaultBrowser();
    await browser.launch();
    const logger = TestLogger.forTest(module);
    context = await browser.newContext({ logger });
  });

  afterEach(async () => {
    await page.close();
  });

  beforeEach(async () => {
    TestLogger.testNumber += 1;
    page = await context.newPage();
    server.reset();
    httpsServer.reset();
  });

  afterAll(async () => {
    await server.stop();
    await httpsServer.stop();
    await context.close();
    await browser.close();
  });

  it('Page.workers', async () => {
    await Promise.all([page.waitOn('worker'), page.goto(`${server.baseUrl}/worker/worker.html`)]);
    const worker = page.workers[0];
    expect(worker.url).toContain('worker.js');

    // don't have a way to determine if the worker is loaded yet
    for (let i = 0; i < 10; i += 1) {
      const isReady = await worker.evaluate<boolean>('!!self.workerFunction');
      if (isReady) break;
      await new Promise(setImmediate);
    }
    expect(await worker.evaluate(`self.workerFunction()`)).toBe('worker function result');
    await page.goto(server.emptyPage);
    expect(page.workers.length).toBe(0);
  });

  // TODO re-enabled when runtime enabled or we have new console logging logic
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should report console logs', async () => {
    const [message] = await Promise.all<{ message: string }>([
      page.waitOn('console'),
      page.evaluate(`(() => {
        new Worker(
          URL.createObjectURL(new Blob(['console.log(1)'], { type: 'application/javascript' })),
        );
      })()`),
    ]);
    expect(message.message).toBe('1');
  });

  it('should evaluate', async () => {
    const workerCreatedPromise = page.waitOn('worker');
    await page.evaluate(`(() => {
        new Worker(
          URL.createObjectURL(new Blob(['console.log(1)'], { type: 'application/javascript' })),
        );
    })()`);
    const { worker } = await workerCreatedPromise;
    expect(await worker.evaluate('1+1')).toBe(2);
  });

  // TODO re-enabled when runtime enabled or we have new console logging logic
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should report errors', async () => {
    const errorPromise = new Promise<{ error: Error }>(resolve => page.on('page-error', resolve));
    await page.evaluate(
      `(() => {
        const blobFn =  \`setTimeout(() => {
          // Do a console.log just to check that we do not confuse it with an error.
          console.log('hey');
          throw new Error('this is my error');
        })\`;
        new Worker(
          URL.createObjectURL(new Blob([blobFn], { type: 'application/javascript' })),
        );
     })()`,
    );
    const { error } = await errorPromise;
    expect(error.stack).toContain('this is my error');
  });

  it('should clear upon navigation', async () => {
    await page.goto(server.emptyPage);
    const workerCreatedPromise = page.waitOn('worker');
    await page.evaluate(`(() => {
        new Worker(
          URL.createObjectURL(new Blob(['console.log(1)'], { type: 'application/javascript' })),
        );
    })()`);
    const { worker } = await workerCreatedPromise;
    expect(page.workers.length).toBe(1);
    let destroyed = false;
    worker.once('close', () => (destroyed = true));
    await page.goto(`${server.baseUrl}/one-style.html`);
    expect(destroyed).toBe(true);
    expect(page.workers.length).toBe(0);
  });

  it('should clear upon cross-process navigation', async () => {
    await page.goto(server.emptyPage);
    const workerCreatedPromise = page.waitOn('worker');
    await page.evaluate(`(() => {
        new Worker(
          URL.createObjectURL(new Blob(['console.log(1)'], { type: 'application/javascript' })),
        );
    })()`);
    const { worker } = await workerCreatedPromise;
    expect(page.workers.length).toBe(1);
    let destroyed = false;
    worker.once('close', () => (destroyed = true));
    await page.goto(`${server.crossProcessBaseUrl}/empty.html`);
    expect(destroyed).toBe(true);
    expect(page.workers.length).toBe(0);
  });

  it('should report network activity', async () => {
    const [workerEvent] = await Promise.all([
      page.waitOn('worker'),
      page.goto(`${server.baseUrl}/worker/worker.html`),
    ]);
    const url = `${server.baseUrl}/one-style.css`;
    const requestPromise = page.waitOn(
      'resource-will-be-requested',
      x => x.resource.url.href === url,
    );
    await workerEvent.worker.evaluate(`(async () => {
        await fetch("${url}")
          .then(response => response.text())
          .then(console.log);
      })();`);
    const request = await requestPromise;
    expect(request.resource.url.href).toBe(url);
  });

  it('should report network activity on worker creation', async () => {
    // Chromium needs waitForDebugger enabled for this one.
    await page.goto(server.emptyPage);
    const url = `${server.baseUrl}/one-style.css`;
    const requestPromise = page.waitOn('resource-will-be-requested', x =>
      x.resource.url.href.includes('one-style.css'),
    );

    await page.evaluate(`(() => {
        new Worker(
          URL.createObjectURL(
            new Blob(
              [
  \`fetch("${url}").then(response => response.text()).then(console.log);\`
              ],
              { type: 'application/javascript' },
            ),
          ),
        );
      })();`);
    const request = await requestPromise;
    expect(request.resource.url.href).toBe(url);
  });

  it('should survive shared worker restart', async () => {
    const page1 = await context.newPage();
    await page1.goto(server.url('/worker/shared-worker.html'));
    expect(await page1.evaluate('window.sharedWorkerResponsePromise')).toBe('echo:hello');
    await page1.close();

    const page2 = await context.newPage();
    await page2.goto(server.url('/worker/shared-worker.html'));
    expect(await page2.evaluate('window.sharedWorkerResponsePromise')).toBe('echo:hello');
    await page2.close();
  });
});
