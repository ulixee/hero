import Chrome80 from '@secret-agent/emulate-chrome-80';
import Chrome83 from '@secret-agent/emulate-chrome-83';
import { URL } from 'url';
import { TestServer } from './server';
import Puppet from '../index';
import { getExecutablePath } from '../lib/browserPaths';
import IPuppetContext from '../interfaces/IPuppetContext';
import { createTestPage, ITestPage } from './TestPage';

describe.each([
  [Chrome80.engine.browser, Chrome80.engine.revision],
  [Chrome83.engine.browser, Chrome83.engine.revision],
])('BrowserContext for %s@%s', (browserEngine: string, revision: string) => {
  let server: TestServer;
  let puppet: Puppet;
  const needsClosing = [];

  const defaultEmulator = {
    userAgent: 'Page tests',
    acceptLanguage: 'en',
    platform: 'Linux',
    proxyPassword: '',
  };

  beforeAll(async () => {
    server = await TestServer.create(0);
    const engineExecutablePath = getExecutablePath(browserEngine, revision);
    puppet = new Puppet({ engine: { browser: browserEngine, revision }, engineExecutablePath });
    await puppet.start();
  });

  afterAll(async () => {
    await server.stop();
    await puppet.close();
  });

  afterEach(async () => {
    server.reset();
    await Promise.all(needsClosing.map(x => x.close()));
    needsClosing.length = 0;
  });

  describe('basic', () => {
    it('should create new context', async () => {
      const context = await puppet.newContext(defaultEmulator);
      needsClosing.push(context);
      expect(context).toBeTruthy();
      await context.close();
    });

    it('should isolate localStorage and cookies', async () => {
      // Create two incognito contexts.
      const context1 = await puppet.newContext(defaultEmulator);
      needsClosing.push(context1);
      const context2 = await puppet.newContext(defaultEmulator);
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
      const context = await puppet.newContext(defaultEmulator);
      needsClosing.push(context);
      await expect(context.close()).resolves.toBe(undefined);
    });

    it('close() should be callable twice', async () => {
      const context = await puppet.newContext(defaultEmulator);
      needsClosing.push(context);
      await Promise.all([context.close(), context.close()]);
      await expect(context.close()).resolves.toBe(undefined);
    });
  });

  describe('emulator', () => {
    it('should set for all pages', async () => {
      {
        const context = await puppet.newContext(defaultEmulator);
        needsClosing.push(context);
        const page = await context.newPage();
        needsClosing.push(page);
        expect(await page.evaluate(`navigator.userAgent`)).toBe(defaultEmulator.userAgent);
        expect(await page.evaluate(`navigator.platform`)).toBe(defaultEmulator.platform);
        expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['en']);
        await context.close();
      }
      {
        const context = await puppet.newContext({
          userAgent: 'foobar',
          platform: 'Windows',
          acceptLanguage: 'de',
          proxyPassword: '',
        });
        needsClosing.push(context);
        const page = await context.newPage();
        needsClosing.push(page);
        const [request] = await Promise.all([
          server.waitForRequest('/empty.html'),
          page.navigate(server.emptyPage),
        ]);
        expect(request.headers['user-agent']).toBe('foobar');
        expect(await page.evaluate(`navigator.userAgent`)).toBe('foobar');
        expect(await page.evaluate(`navigator.platform`)).toBe('Windows');
        expect(await page.evaluate(`navigator.languages`)).toStrictEqual(['de']);
        await context.close();
      }
    });

    it('should work for subframes', async () => {
      {
        const context = await puppet.newContext(defaultEmulator);
        needsClosing.push(context);
        const page = await context.newPage();
        needsClosing.push(page);
        expect(await page.evaluate(`navigator.userAgent`)).toContain(defaultEmulator.userAgent);
        await context.close();
      }
      {
        const context = await puppet.newContext({ userAgent: 'foobar' } as any);
        needsClosing.push(context);
        const page = await context.newPage();
        needsClosing.push(page);
        const [request] = await Promise.all([
          server.waitForRequest('/empty.html'),
          page.evaluate(`(async () => {
          const frame = document.createElement('iframe');
          frame.src = '${server.emptyPage}';
          frame.id = 'frame1';
          document.body.appendChild(frame);
          await new Promise(x => frame.onload = x);
        })()`),
        ]);
        expect((request as any).headers['user-agent']).toBe('foobar');
        await context.close();
      }
    });
  });

  describe('cookies', () => {
    let context: IPuppetContext;
    let page: ITestPage;
    beforeEach(async () => {
      context = await puppet.newContext(defaultEmulator);
      page = createTestPage(await context.newPage());
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
      expect(cookies[0].expires).toBe('-1');
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
      expect(await context.getCookies()).toStrictEqual([
        {
          name: 'gridcookie',
          value: 'GRID',
          domain: 'localhost',
          path: '/grid.html',
          expires: '-1',
          secure: false,
          httpOnly: false,
          sameSite: 'None',
        },
      ]);
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
      const allowsThirdParty = false; // options.CHROMIUM || options.FIREFOX;
      const cookies = await context.getCookies(new URL(`${server.crossProcessBaseUrl}/grid.html}`));
      if (allowsThirdParty) {
        expect(cookies).toEqual([
          {
            domain: '127.0.0.1',
            expires: -1,
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
      expect(await context.getCookies()).toEqual([
        {
          name: 'username',
          value: 'John Doe',
          domain: 'localhost',
          path: '/',
          expires: '-1',
          httpOnly: false,
          secure: false,
          sameSite: 'None',
        },
      ]);
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
      expect(await context.getCookies()).toEqual([
        {
          name: 'username',
          value: 'John Doe',
          domain: 'localhost',
          path: '/',
          expires: String(date / 1000),
          httpOnly: false,
          secure: false,
          sameSite: 'None',
        },
      ]);
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
      expect(cookies).toEqual([
        {
          name: 'doggo',
          value: 'woofs',
          domain: 'foo.com',
          path: '/',
          expires: '-1',
          httpOnly: false,
          secure: true,
          sameSite: 'None',
        },
      ]);
    });
  });
});
