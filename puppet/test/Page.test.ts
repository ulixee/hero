import ConsoleMessage from '@secret-agent/puppet-chrome/lib/ConsoleMessage';
import { TestServer } from './server';
import { IPuppetPage } from '../interfaces/IPuppetPage';
import { getExecutablePath } from '../lib/browserPaths';
import Puppet from '../index';
import IPuppetContext from '../interfaces/IPuppetContext';
import { createTestPage, ITestPage } from './TestPage';

describe.each([['chromium', '756035']])(
  'Pages for %s@%s',
  (browserEngine: string, revision: string) => {
    let server: TestServer;
    let page: ITestPage;
    let puppet: Puppet;
    let context: IPuppetContext;

    beforeAll(async () => {
      server = await TestServer.create(0);
      const engineExecutablePath = getExecutablePath(browserEngine, revision);
      puppet = new Puppet({ browserEngine, engineExecutablePath });
      await puppet.start();
      context = await puppet.newContext({
        userAgent: 'Page tests',
        acceptLanguage: 'en',
        platform: 'Linux',
        proxyPassword: '',
      });
    });

    afterEach(async () => {
      await page.close();
    });

    beforeEach(async () => {
      page = createTestPage(await context.newPage());
      server.reset();
    });

    afterAll(async () => {
      await server.stop();
      await context.close();
      await puppet.close();
    });

    describe('basic', () => {
      it('should reject all promises when page is closed', async () => {
        const newPage = await context.newPage();
        let error = null;
        await Promise.all([
          newPage.evaluate(`new Promise(r => {})`).catch(e => (error = e)),
          newPage.close(),
        ]);
        expect(error.message).toContain('Protocol error');
      });

      it('should run beforeunload', async () => {
        const waitForConsole = page.waitOn('console', event => {
          return event.message === 'Before called';
        });
        await page.goto(server.url('beforeunload.html'));
        // We have to interact with a page so that 'beforeunload' handlers
        // fire.
        await page.click('div');
        await page.close();

        const message = await waitForConsole;
        await expect(message.message).toBe('Before called');
        await expect(message.frameId).toBe(page.mainFrame.id);
      });

      it('should set the page close state', async () => {
        const newPage = await context.newPage();
        expect(newPage.isClosed).toBe(false);
        await newPage.close();
        expect(newPage.isClosed).toBe(true);
      });

      it('should be callable twice', async () => {
        const newPage = await context.newPage();
        await Promise.all([newPage.close(), newPage.close()]);
        await expect(newPage.close()).resolves.not.toBeTruthy();
      });

      it('page.url should work', async () => {
        expect(page.mainFrame.url).toBe('about:blank');
        await page.goto(server.emptyPage);
        expect(page.mainFrame.url).toBe(server.emptyPage);
      });

      it('page.url should include hashes', async () => {
        await page.goto(`${server.emptyPage}#hash`);
        expect(page.mainFrame.url).toBe(`${server.emptyPage}#hash`);

        await Promise.all([
          page.evaluate(`window.location.hash = 'dynamic';`),
          page.waitOn('frame-navigated', event => {
            return event.navigatedInDocument;
          }),
        ]);
        expect(page.mainFrame.url).toBe(`${server.emptyPage}#dynamic`);
      });

      it('page.close should work with window.close', async () => {
        const newPagePromise = new Promise<IPuppetPage>(resolve => {
          page.popupInitializeFn = async page1 => {
            resolve(page1);
          };
        });
        await page.evaluate(`(() => { 
    window.newPage = window.open('about:blank');
})()`);
        const newPage = await newPagePromise;
        const closedPromise = newPage.waitOn('close');
        await page.evaluate(`window.newPage.close()`);
        await expect(closedPromise).resolves.toBe(undefined);
      });

      it('page.close should work with page.close', async () => {
        const newPage = await context.newPage();
        const closedPromise = newPage.waitOn('close');
        await newPage.close();
        await expect(closedPromise).resolves.toBe(undefined);
      });

      it('should think that it is focused by default', async () => {
        expect(await page.evaluate('document.hasFocus()')).toBe(true);
      });

      it('should think that all pages are focused', async () => {
        const page2 = await context.newPage();
        expect(await page.evaluate('document.hasFocus()')).toBe(true);
        expect(await page2.evaluate('document.hasFocus()')).toBe(true);
        await page2.close();
      });

      it('should focus popups by default', async () => {
        await page.goto(server.emptyPage);
        const [popup] = await Promise.all<IPuppetPage, any>([
          page.waitForPopup(),
          page.evaluate(`(() => {
        window.open('${server.emptyPage}');
      })()`),
        ]);
        await popup.waitOn('frame-lifecycle', event => event.name === 'load');
        expect(await popup.evaluate('document.hasFocus()')).toBe(true);
        expect(await page.evaluate('document.hasFocus()')).toBe(true);
      });
    });

    describe('addNewDocumentScript', () => {
      it('should evaluate before anything else on the page', async () => {
        await page.addNewDocumentScript(`window.injected = 123;`, false);
        await page.goto(server.url('tamperable.html'), 'DOMContentLoaded');
        expect(await page.evaluate('window.result')).toBe(123);
      });

      it('should support multiple scripts', async () => {
        await page.addNewDocumentScript(`window.script1 = 1;`, false);
        await page.addNewDocumentScript(`window.script2 = 2;`, false);
        await page.goto(server.url('tamperable.html'), 'DOMContentLoaded');
        expect(await page.evaluate('window.script1')).toBe(1);
        expect(await page.evaluate('window.script2')).toBe(2);
      });

      it('should work with CSP', async () => {
        server.setCSP('/empty.html', `script-src ${server.baseUrl}`);
        await page.addNewDocumentScript(`window.injected = 123;`, false);
        await page.goto(server.emptyPage, 'DOMContentLoaded');
        expect(await page.evaluate('window.injected')).toBe(123);
      });

      it('should work after a cross origin navigation', async () => {
        await page.goto(server.crossProcessBaseUrl);
        await page.addNewDocumentScript(`window.injected = 123;`, false);

        await page.goto(server.url('tamperable.html'), 'DOMContentLoaded');
        expect(await page.evaluate('window.result')).toBe(123);
      });
    });

    describe('console', () => {
      it('should print out nested objects', async () => {
        const [message] = await Promise.all([
          page.waitOn('console'),
          page.evaluate(`console.log('hello', 5, { foo: 'bar' })`),
        ]);
        expect((message as ConsoleMessage).message).toEqual(`hello 5 "{ foo: bar }"`);
      });

      it('should emit same log twice', async () => {
        const messages = [];
        page.on('console', m => messages.push(m.message));
        await page.evaluate(`
      for (let i = 0; i < 2; ++i) console.log('hello');
    `);
        expect(messages).toEqual(['hello', 'hello']);
      });
    });

    describe('crash', () => {
      it('should emit crash event when page crashes', async () => {
        page.navigate('chrome://crash').catch(e => {});
        await expect(page.waitOn('crashed')).resolves.toMatchObject({
          error: new Error('Target Crashed'),
        });
      });
    });

    describe('ensure no hanging', () => {
      it('clicking on links which do not commit navigation', async () => {
        await page.goto(server.emptyPage);
        await page.setContent(`<a href='${server.emptyPage}'>foobar</a>`);
        await page.click('a');
        await expect(page.close()).resolves.toBe(undefined);
      });

      it('calling window.stop async', async () => {
        server.setRoute('/empty.html', async () => {});
        await page.evaluate(
          `((url) => {
      window.location.href = url;
      setTimeout(() => window.stop(), 100);
    })('${server.emptyPage}')`,
        );
      });

      it('calling window.stop sync', async () => {
        await page.evaluate(`(url => {
        window.location.href = url;
        window.stop();
      })('${server.emptyPage}')`);
      });

      it('assigning location to about:blank', async () => {
        await page.goto(server.emptyPage);
        await page.evaluate(`window.location.href = "about:blank";`);
      });

      it('assigning location to about:blank after non-about:blank', async () => {
        server.setRoute('/empty.html', async () => {});
        await page.evaluate(`
      window.location.href = "${server.emptyPage}";
      window.location.href = "about:blank";`);
      });

      it('calling window.open and window.close', async () => {
        await page.goto(server.emptyPage);
        await page.evaluate(`(() => {
      const popup = window.open(window.location.href);
      popup.close();
    })()`);
      });
    });
  },
);
