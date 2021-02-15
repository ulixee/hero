import Chrome80 from '@secret-agent/emulate-chrome-80';
import Chrome83 from '@secret-agent/emulate-chrome-83';
import Log from '@secret-agent/commons/Logger';
import IPuppetContext from '@secret-agent/puppet-interfaces/IPuppetContext';
import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import { TestServer } from './server';
import Puppet from '../index';
import { createTestPage, ITestPage } from './TestPage';
import defaultEmulation from './_defaultEmulation';

const { log } = Log(module);

describe.each([[Chrome80.engine], [Chrome83.engine]])(
  'Page.navigate for %s@%s',
  (browserEngine: IBrowserEngine) => {
    let server: TestServer;
    let httpsServer: TestServer;
    let page: ITestPage;
    let puppet: Puppet;
    let context: IPuppetContext;
    const needsClosing = [];

    beforeAll(async () => {
      server = await TestServer.create(0);
      httpsServer = await TestServer.createHTTPS(0);
      puppet = new Puppet(browserEngine);
      await puppet.start();
      context = await puppet.newContext(defaultEmulation, log);
      context.on('page', event => {
        needsClosing.push(event.page);
      });
    });

    afterEach(async () => {
      await page.close();
      for (const close of needsClosing) {
        await close.close();
      }
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

    const options = {
      CHROMIUM: browserEngine.browser === 'chromium' || browserEngine.browser === 'chrome',
      WEBKIT: browserEngine.browser === 'webkit',
      FIREFOX: browserEngine.browser === 'firefox',
    };

    const isWindows = process.platform === 'win32';

    describe('navigate', () => {
      it('should work with anchor navigation', async () => {
        await page.goto(server.emptyPage);
        expect(page.mainFrame.url).toBe(server.emptyPage);
        await page.goto(`${server.emptyPage}#foo`);
        expect(page.mainFrame.url).toBe(`${server.emptyPage}#foo`);
        await page.goto(`${server.emptyPage}#bar`);
        expect(page.mainFrame.url).toBe(`${server.emptyPage}#bar`);
      });

      it('should work with redirects', async () => {
        server.setRedirect('/redirect/1.html', '/redirect/2.html');
        server.setRedirect('/redirect/2.html', '/empty.html');
        await page.goto(`${server.baseUrl}/redirect/1.html`);
        expect(page.mainFrame.url).toBe(server.emptyPage);
      });

      it('should work with subframes return 204', async () => {
        server.setRoute('/frames/frame.html', (req, res) => {
          res.statusCode = 204;
          res.end();
        });
        await expect(page.goto(`${server.baseUrl}/frames/one-frame.html`)).resolves.toBe(undefined);
      });

      it('should work with subframes return 204 with domcontentloaded', async () => {
        server.setRoute('/frames/frame.html', (req, res) => {
          res.statusCode = 204;
          res.end();
        });
        const wait = page.waitOn('frame-lifecycle', event => event.name === 'DOMContentLoaded');
        await page.goto(`${server.baseUrl}/frames/one-frame.html`);
        await expect(wait).resolves.toBeTruthy();
      });

      it('should fail when server returns 204', async () => {
        // Webkit just loads an empty page.
        server.setRoute('/empty.html', (req, res) => {
          res.statusCode = 204;
          res.end();
        });
        let error = null;
        await page.goto(server.emptyPage).catch(e => (error = e));
        expect(error).not.toBe(null);
        if (browserEngine.browser === 'chromium' || browserEngine.browser === 'chrome')
          expect(error.message).toContain('net::ERR_ABORTED');
        else if (browserEngine.browser === 'webkit')
          expect(error.message).toContain('Aborted: 204 No Content');
        else expect(error.message).toContain('NS_BINDING_ABORTED');
      });

      it('should work when page calls history API in beforeunload', async () => {
        await page.goto(server.emptyPage);
        await page.evaluate(`(() => {
          window.addEventListener(
            'beforeunload',
            () => history.replaceState(null, 'initial', window.location.href),
            false,
          );
        })()`);
        const waitForLoad = page.waitOn(
          'frame-lifecycle',
          event => event.name === 'DOMContentLoaded',
        );
        await page.navigate(`${server.baseUrl}/grid.html`);
        await expect(waitForLoad).resolves.toBeTruthy();
      });

      it('should fail when navigating to bad url', async () => {
        let error = null;
        await page.goto('asdfasdf').catch(e => (error = e));
        if (options.CHROMIUM || options.WEBKIT)
          expect(error.message).toContain('Cannot navigate to invalid URL');
        else expect(error.message).toContain('Invalid url');
      });

      it('should fail when main resources failed to load', async () => {
        let error = null;
        await page.goto('http://localhost:44123/non-existing-url').catch(e => (error = e));
        if (options.CHROMIUM) expect(error.message).toContain('net::ERR_CONNECTION_REFUSED');
        else if (options.WEBKIT && isWindows)
          expect(error.message).toContain(`Couldn't connect to server`);
        else if (options.WEBKIT) expect(error.message).toContain('Could not connect');
        else expect(error.message).toContain('NS_ERROR_CONNECTION_REFUSED');
      });

      it('should fail when replaced by another navigation', async () => {
        let anotherPromise;
        server.setRoute('/empty.html', () => {
          anotherPromise = page.goto(`${server.baseUrl}/one-style.html`);
          // Hang request to empty.html.
        });
        const error = await page.goto(`${server.baseUrl}/empty.html`).catch(e => e);
        await anotherPromise;
        if (options.CHROMIUM) expect(error.message).toContain('net::ERR_ABORTED');
        else if (options.WEBKIT) expect(error.message).toContain('cancelled');
        else expect(error.message).toContain('NS_BINDING_ABORTED');
      });

      it('should work when navigating to data url', async () => {
        await page.goto('data:text/html,hello');
        expect(page.mainFrame.url).toBe('data:text/html,hello');
      });

      it('should set last url in redirect chain', async () => {
        server.setRedirect('/redirect/1.html', '/redirect/2.html');
        server.setRedirect('/redirect/2.html', '/redirect/3.html');
        server.setRedirect('/redirect/3.html', server.emptyPage);
        await page.goto(`${server.baseUrl}/redirect/1.html`);
        expect(page.mainFrame.url).toBe(server.emptyPage);
      });

      it('should not leak listeners during navigation of 20 pages', async () => {
        let warning = null;
        const warningHandler = w => (warning = w);
        process.on('warning', warningHandler);
        await Promise.all(
          [...Array(20)].map(async () => {
            const testPage = await context.newPage();
            await testPage.navigate(server.emptyPage);
            await testPage.close();
          }),
        );
        process.off('warning', warningHandler);
        expect(warning).toBe(null);
      }, 30e3);

      it('should not leak listeners during 20 frameNavigated', async () => {
        let warning = null;
        const warningHandler = w => (warning = w);
        process.on('warning', warningHandler);
        const promises = [...Array(20)].map(() => page.waitOn('frame-navigated'));
        await page.goto(server.emptyPage);
        await Promise.all(promises);
        process.off('warning', warningHandler);
        expect(warning).toBe(null);
      });

      it('should work with self requesting page', async () => {
        await expect(page.goto(`${server.baseUrl}/self-request.html`)).resolves.toBe(undefined);
      });

      it('should be able to navigate to a page controlled by service worker', async () => {
        await page.goto(`${server.baseUrl}/serviceworkers/fetch/sw.html`);
        await page.evaluate(`window.activationPromise`);
        await expect(page.goto(`${server.baseUrl}/serviceworkers/fetch/sw.html`)).resolves.toBe(
          undefined,
        );
      });

      it('should fail when canceled by another navigation', async () => {
        server.setRoute('/one-style.html', () => {});
        const failed = page.goto(`${server.baseUrl}/one-style.html`).catch(e => e);
        await server.waitForRequest('/one-style.html');
        await page.goto(`${server.baseUrl}/empty.html`);
        const error = await failed;
        expect(error.message).toBeTruthy();
      });

      it('should work with lazy loading iframes', async () => {
        await page.goto(`${server.baseUrl}/frames/lazy-frame.html`);
        expect(page.frames.length).toBe(2);
      });

      it('should work with mixed content', async () => {
        httpsServer.setRoute('/mixedcontent.html', (req, res) => {
          res.end(`<iframe src=${server.emptyPage}></iframe>`);
        });
        await expect(page.goto(`${httpsServer.baseUrl}/mixedcontent.html`, 'load')).resolves.toBe(
          undefined,
        );
        expect(page.frames).toHaveLength(2);
      });
    });

    describe('history', () => {
      it('page.goBack should work', async () => {
        expect(await page.goBack()).toBe(null);

        await page.goto(server.emptyPage);
        await page.goto(server.url('grid.html'));

        await page.goBack();
        expect(page.mainFrame.url).toContain(server.emptyPage);

        await page.goForward();
        expect(page.mainFrame.url).toContain('/grid.html');
      });

      it('page.goBack should work with HistoryAPI', async () => {
        await page.goto(server.emptyPage);
        await page.evaluate(`
      history.pushState({}, '', '/first.html');
      history.pushState({}, '', '/second.html');
    `);
        expect(page.mainFrame.url).toBe(server.url('second.html'));

        await page.goBack();
        expect(page.mainFrame.url).toBe(server.url('first.html'));
        await page.goBack();
        expect(page.mainFrame.url).toBe(server.emptyPage);
        await page.goForward();
        expect(page.mainFrame.url).toBe(server.url('first.html'));
      });
    });
  },
);
