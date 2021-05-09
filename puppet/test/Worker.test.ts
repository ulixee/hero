import Log from '@secret-agent/commons/Logger';
import IPuppetContext from '@secret-agent/interfaces/IPuppetContext';
import Plugins from '@secret-agent/core/lib/Plugins';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import Core from '@secret-agent/core';
import { TestServer } from './server';
import { createTestPage, ITestPage } from './TestPage';
import Puppet from '../index';
import CustomBrowserEmulator from './_CustomBrowserEmulator';

const { log } = Log(module);
const browserEmulatorId = CustomBrowserEmulator.id;

describe('Worker test', () => {
  let server: TestServer;
  let httpsServer: TestServer;
  let page: ITestPage;
  let puppet: Puppet;
  let context: IPuppetContext;

  beforeAll(async () => {
    Core.use(CustomBrowserEmulator);
    const { browserEngine } = CustomBrowserEmulator.selectBrowserMeta();
    server = await TestServer.create(0);
    httpsServer = await TestServer.createHTTPS(0);
    puppet = new Puppet(browserEngine);
    await puppet.start();
    const plugins = new Plugins({ browserEmulatorId }, log as IBoundLog);
    context = await puppet.newContext(plugins, log);
  });

  afterEach(async () => {
    await page.close();
  });

  beforeEach(async () => {
    page = createTestPage(await context.newPage());
    server.reset();
    httpsServer.reset();
  });

  afterAll(async () => {
    await server.stop();
    await httpsServer.stop();
    await context.close();
    await puppet.close();
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

  it('should report console logs', async () => {
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

  it('should report errors', async () => {
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
});
