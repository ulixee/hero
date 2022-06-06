import { Helpers, Hero } from '@ulixee/hero-testing';
import Resource from '@ulixee/hero/lib/Resource';

let koaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Full Client tests', () => {
  it('runs goto', async () => {
    const exampleUrl = `${koaServer.baseUrl}/`;
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(exampleUrl);
    const url = await hero.document.location.host;
    expect(url).toBe(koaServer.baseHost);
  });

  it('can provide a sessionId', async () => {
    const hero = new Hero({ sessionId: 'session1' });
    Helpers.needsClosing.push(hero);
    expect(await hero.sessionId).toBe('session1');
  });

  it('allows you to block resources', async () => {
    koaServer.get('/block', ctx => {
      ctx.body = `<html>
<head>
  <link rel="stylesheet" href="/test.css" />
</head>
<body>
  <img src="/img.png" alt="Image"/>
</body>
</html>`;
    });

    koaServer.get('/img.png', ctx => {
      ctx.statusCode = 500;
    });
    koaServer.get('/test.css', ctx => {
      ctx.statusCode = 500;
    });

    const hero = new Hero({
      blockedResourceTypes: ['BlockAssets'],
    });
    Helpers.needsClosing.push(hero);

    const resources: Resource[] = [];
    await hero.activeTab.on('resource', event => resources.push(event as any));
    await hero.goto(`${koaServer.baseUrl}/block`);
    await hero.waitForPaintingStable();
    await new Promise(setImmediate);
    expect(resources).toHaveLength(1);
    expect(await resources[0].response.statusCode).toBe(200);
    expect(resources[0].type).toBe('Document');
  });

  it('should get unreachable proxy errors in the client', async () => {
    const hero = new Hero({
      upstreamProxyUrl: koaServer.baseUrl,
      upstreamProxyIpMask: {
        proxyIp: '127.0.0.1',
        publicIp: '127.0.0.1',
      },
    });
    Helpers.needsClosing.push(hero);
    await expect(hero.goto(`${koaServer.baseUrl}/`)).rejects.toThrow();
  });

  it('can access the location with no document loaded', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);
    const url = await hero.document.location.host;
    expect(url).toBe('');
  });

  it('gets the resource back from a goto', async () => {
    const exampleUrl = `${koaServer.baseUrl}/`;
    const hero = new Hero({
      locale: 'en-US,en',
    });
    Helpers.needsClosing.push(hero);

    const resource = await hero.goto(exampleUrl);
    const { request, response } = resource;
    expect(await request.headers).toMatchObject({
      Host: koaServer.baseHost,
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': expect.any(String),
      Accept: expect.any(String),
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9',
    });
    expect(await request.url).toBe(exampleUrl);
    expect(await request.timestamp).toBeTruthy();
    expect(await request.method).toBe('GET');
    expect(await request.postData).toEqual(Buffer.from(''));

    expect(await response.headers).toMatchObject({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': expect.any(String),
      Date: expect.any(String),
      Connection: 'keep-alive',
    });
    expect(await response.url).toBe(exampleUrl);
    expect(await response.timestamp).toBeTruthy();
    expect(await response.remoteAddress).toBeTruthy();
    expect(await response.statusCode).toBe(200);
    expect(await response.statusMessage).toBe('OK');
    expect(await response.text).toMatch('<h1>Example Domain</h1>');
  });

  it('can get and set cookies', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    koaServer.get('/cookies', ctx => {
      ctx.cookies.set('Cookie1', 'This is a test', {
        httpOnly: true,
      });
      ctx.body = '';
    });

    await hero.goto(`${koaServer.baseUrl}/cookies`);
    const cookieStorage = hero.activeTab.cookieStorage;
    {
      expect(await cookieStorage.length).toBe(1);
      const cookie = await cookieStorage.getItem('Cookie1');
      expect(cookie.expires).toBe(undefined);
      expect(cookie.httpOnly).toBe(true);
      // httponly not in doc
      const documentCookies = await hero.getJsValue('document.cookie');
      expect(documentCookies).toBe('');
    }
    {
      const expires = new Date();
      expires.setTime(Date.now() + 10e3);
      await cookieStorage.setItem('Cookie2', 'test2', { expires });
      expect(await cookieStorage.length).toBe(2);
      const cookie = await cookieStorage.getItem('Cookie2');
      expect(cookie.expires).toBe(expires.toISOString());
      expect(cookie.httpOnly).toBe(false);

      const documentCookies = await hero.getJsValue('document.cookie');
      expect(documentCookies).toBe('Cookie2=test2');
    }
    // test deleting
    {
      await cookieStorage.removeItem('Cookie2');
      expect(await cookieStorage.length).toBe(1);
      const documentCookies = await hero.getJsValue('document.cookie');
      expect(documentCookies).toBe('');
    }
  });

  it('should send a friendly message if trying to set cookies before a url is loaded', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await expect(hero.activeTab.cookieStorage.setItem('test', 'test')).rejects.toThrowError(
      "Chrome won't allow you to set cookies on a blank tab.",
    );
  });

  it('can get and set localStorage', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    await hero.goto(`${koaServer.baseUrl}/`);
    const localStorage = hero.activeTab.localStorage;
    expect(await localStorage.length).toBe(0);
    await localStorage.setItem('Test1', 'here');
    expect(await localStorage.length).toBe(1);

    await expect(hero.getJsValue('localStorage.getItem("Test1")')).resolves.toBe('here');

    expect(await localStorage.key(0)).toBe('Test1');
    await localStorage.removeItem('Test1');
    expect(await localStorage.length).toBe(0);
  });
});
