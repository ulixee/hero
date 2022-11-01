import { browserEngineOptions } from '@ulixee/unblocked-agent-testing/browserUtils';
import TestLogger from '@ulixee/unblocked-agent-testing/TestLogger';
import { URL } from 'url';
import { Browser, BrowserContext, Page } from '../index';
import { TestServer } from './server';

describe('BrowserContext', () => {
  let server: TestServer;
  let browser: Browser;
  const needsClosing: { close: () => Promise<any> | void }[] = [];

  beforeAll(async () => {
    server = await TestServer.create(0);
    browser = new Browser(browserEngineOptions);
    await browser.launch();
  });

  afterAll(async () => {
    await server.stop();
    await browser.close();
  });

  afterEach(async () => {
    server.reset();
    await Promise.all(needsClosing.map(x => x.close()));
    needsClosing.length = 0;
  });

  describe('basic', () => {
    beforeEach(() => {
      TestLogger.testNumber += 1;
    });
    it('should create new context', async () => {
      const logger = TestLogger.forTest(module);
      const context = await browser.newContext({ logger });
      needsClosing.push(context);
      expect(context).toBeTruthy();
      await context.close();
    });

    it('should isolate localStorage and cookies', async () => {
      // Create two incognito contexts.
      const logger = TestLogger.forTest(module);
      const context1 = await browser.newContext({ logger });
      needsClosing.push(context1);

      const context2 = await browser.newContext({ logger });
      needsClosing.push(context2);

      // Create a page in first incognito context.
      const page1 = await context1.newPage();
      needsClosing.push(page1);
      await page1.navigate(server.emptyPage);
      await page1.evaluate(`
        localStorage.setItem('name', 'page1');
        document.cookie = 'name=page1';
      `);

      // Create a page in second incognito context.
      const page2 = await context2.newPage();
      needsClosing.push(page2);
      await page2.navigate(server.emptyPage);
      await page2.evaluate(`
        localStorage.setItem('name', 'page2');
        document.cookie = 'name=page2';
      `);

      // Make sure pages don't share localstorage or cookies.
      expect(await page1.evaluate(`localStorage.getItem('name')`)).toBe('page1');
      expect(await page1.evaluate(`document.cookie`)).toBe('name=page1');
      expect(await page2.evaluate(`localStorage.getItem('name')`)).toBe('page2');
      expect(await page2.evaluate(`document.cookie`)).toBe('name=page2');

      // Cleanup contexts.
      await Promise.all([context1.close(), context2.close()]);
    });

    it('close() should work for empty context', async () => {
      const logger = TestLogger.forTest(module);
      const context = await browser.newContext({ logger });
      needsClosing.push(context);
      await expect(context.close()).resolves.toBe(undefined);
    });

    it('close() should be callable twice', async () => {
      const logger = TestLogger.forTest(module);
      const context = await browser.newContext({ logger });
      needsClosing.push(context);
      await Promise.all([context.close(), context.close()]);
      await expect(context.close()).resolves.toBe(undefined);
    });

    it('can create a page with the default context', async () => {
      const logger = TestLogger.forTest(module);
      const context = await browser.newContext({ logger, isIncognito: false });
      needsClosing.push(context);
      const page = await context.newPage();
      needsClosing.push(page);
      await expect(page.navigate(server.emptyPage)).resolves.toBeTruthy();
      await expect(context.close()).resolves.toBe(undefined);
    });
  });

  describe('cookies', () => {
    let context: BrowserContext;
    let page: Page;
    beforeEach(async () => {
      TestLogger.testNumber += 1;
      const logger = TestLogger.forTest(module);
      context = await browser.newContext({ logger });
      page = await context.newPage();
    });
    afterEach(async () => {
      await page.close();
      await context.close();
    });

    it('should work', async () => {
      await page.navigate(server.emptyPage);
      await context.addCookies(
        [
          {
            domain: 'localhost',
            name: 'password',
            value: '123456',
          },
        ],
        [server.emptyPage],
      );
      expect(await page.evaluate(`document.cookie`)).toEqual('password=123456');
    });

    it('should roundtrip cookie', async () => {
      await page.navigate(server.emptyPage);
      // @see https://en.wikipedia.org/wiki/Year_2038_problem
      const date = +new Date('1/1/2038');
      const documentCookie = await page.evaluate(`(() => {
    const date = new Date(${date});
    document.cookie = 'username=John Doe;expires=' + date.toUTCString();
    return document.cookie;
  })()`);
      expect(documentCookie).toBe('username=John Doe');
      const cookies = await context.getCookies();
      await page.close();
      await context.addCookies(cookies, [server.emptyPage]);
      expect(await context.getCookies()).toEqual(cookies);
    });

    it('should send cookie header', async () => {
      let cookie = '';
      server.setRoute('/empty.html', (req, res) => {
        cookie = req.headers.cookie;
        res.end();
      });
      await context.addCookies(
        [{ url: server.emptyPage, name: 'cookie', value: 'value' }],
        [server.emptyPage],
      );
      const page2 = await context.newPage();
      await page2.navigate(server.emptyPage);
      expect(cookie).toBe('cookie=value');
      await page2.close();
    });

    it('should set multiple cookies', async () => {
      await page.goto(server.emptyPage);
      await context.addCookies(
        [
          {
            url: server.emptyPage,
            name: 'multiple-1',
            value: '123456',
          },
          {
            url: server.emptyPage,
            name: 'multiple-2',
            value: 'bar',
          },
        ],
        [server.emptyPage],
      );
      expect(
        await page.evaluate(`(() =>{
      const cookies = document.cookie.split(';');
      return cookies.map(cookie => cookie.trim()).sort();
    })()`),
      ).toEqual(['multiple-1=123456', 'multiple-2=bar']);
    });

    it('should have |expires| set to |-1| for session cookies', async () => {
      await context.addCookies(
        [
          {
            url: server.emptyPage,
            name: 'expires',
            value: '123456',
          },
        ],
        [server.emptyPage],
      );
      const cookies = await context.getCookies();
      expect(cookies[0].expires).toBe(undefined);
    });

    it('should set a cookie with a path', async () => {
      await page.goto(`${server.baseUrl}/grid.html`);
      await context.addCookies([
        {
          domain: 'localhost',
          path: '/grid.html',
          name: 'gridcookie',
          value: 'GRID',
        },
      ]);
      expect((await context.getCookies())[0]).toMatchObject({
        name: 'gridcookie',
        value: 'GRID',
        domain: 'localhost',
        path: '/grid.html',
        expires: undefined,
        secure: false,
        httpOnly: false,
        sameSite: 'None',
      });
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
      await page.goto(server.emptyPage);
      expect(await page.evaluate('document.cookie')).toBe('');
      await page.goto(`${server.baseUrl}/grid.html`);
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
    });

    it('should set cookies for a frame', async () => {
      await page.goto(server.emptyPage);
      await context.addCookies([{ url: server.baseUrl, name: 'frame-cookie', value: 'value' }]);
      await page.evaluate(`((src) => {
    let fulfill;
    const promise = new Promise(x => (fulfill = x));
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.onload = fulfill;
    iframe.src = src;
    return promise;
  })('${server.baseUrl}/grid.html')`);

      expect(await page.frames[1].evaluate('document.cookie', false)).toBe('frame-cookie=value');
    });

    it('should(not) block third party cookies', async () => {
      await page.goto(server.emptyPage);
      await page.evaluate(`((src) => {
    let fulfill;
    const promise = new Promise(x => (fulfill = x));
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.onload = fulfill;
    iframe.src = src;
    return promise;
  })('${server.crossProcessBaseUrl}/grid.html')`);
      await page.frames[1].evaluate(`document.cookie = 'username=John Doe'`);
      await new Promise(resolve => setTimeout(resolve, 2e3));
      const allowsThirdParty = false; // options.CHROME || options.FIREFOX;
      const cookies = await context.getCookies(new URL(`${server.crossProcessBaseUrl}/grid.html}`));
      if (allowsThirdParty) {
        expect(cookies).toEqual([
          {
            domain: '127.0.0.1',
            expires: undefined,
            httpOnly: false,
            name: 'username',
            path: '/',
            sameSite: 'None',
            secure: false,
            value: 'John Doe',
          },
        ]);
      }
    });

    it('should get a cookie', async () => {
      await page.navigate(server.emptyPage);
      const documentCookie = await page.evaluate(`(() => {
    document.cookie = 'username=John Doe';
    return document.cookie;
})()`);
      expect(documentCookie).toBe('username=John Doe');
      const cookies = await context.getCookies();
      expect(cookies).toHaveLength(1);
      expect(cookies[0]).toMatchObject({
        name: 'username',
        value: 'John Doe',
        domain: 'localhost',
        path: '/',
        expires: undefined,
        httpOnly: false,
        secure: false,
        sameSite: 'None',
      });
    });

    it('should get a non-session cookie', async () => {
      await page.navigate(server.emptyPage);
      // @see https://en.wikipedia.org/wiki/Year_2038_problem
      const date = +new Date('1/1/2038');
      const documentCookie = await page.evaluate(`(()=>{
    const date = new Date(${date});
    document.cookie = 'username=John Doe;expires=' + date.toUTCString();
    return document.cookie;
  })()`);
      expect(documentCookie).toBe('username=John Doe');
      const cookies = await context.getCookies();
      expect(cookies).toHaveLength(1);
      expect(cookies[0]).toMatchObject({
        name: 'username',
        value: 'John Doe',
        domain: 'localhost',
        path: '/',
        expires: expect.any(String),
        httpOnly: false,
        secure: false,
        sameSite: 'None',
      });
    });

    it('should properly report "Strict" sameSite cookie', async () => {
      server.setRoute('/empty.html', (req, res) => {
        res.setHeader('Set-Cookie', 'name=value;SameSite=Strict');
        res.end();
      });
      await page.navigate(server.emptyPage);
      const cookies = await context.getCookies();
      expect(cookies.length).toBe(1);
      expect(cookies[0].sameSite).toBe('Strict');
    });

    it('should properly report "Lax" sameSite cookie', async () => {
      server.setRoute('/empty.html', (req, res) => {
        res.setHeader('Set-Cookie', 'name=value;SameSite=Lax');
        res.end();
      });
      await page.navigate(server.emptyPage);
      const cookies = await context.getCookies();
      expect(cookies.length).toBe(1);
      expect(cookies[0].sameSite).toBe('Lax');
    });

    it('should get cookies for a url', async () => {
      await context.addCookies([
        {
          url: 'https://foo.com',
          name: 'doggo',
          value: 'woofs',
        },
        {
          url: 'https://bar.com',
          name: 'catto',
          value: 'purrs',
        },
        {
          url: 'https://baz.com',
          name: 'birdo',
          value: 'tweets',
        },
      ]);
      const cookies = await context.getCookies(new URL('https://foo.com'));
      cookies.sort((a, b) => a.name.localeCompare(b.name));
      expect(cookies).toHaveLength(1);
      expect(cookies[0]).toMatchObject({
        name: 'doggo',
        value: 'woofs',
        domain: 'foo.com',
        path: '/',
        expires: undefined,
        httpOnly: false,
        secure: true,
        sameSite: 'None',
      });
    });
  });
});
