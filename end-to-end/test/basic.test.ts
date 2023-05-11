import { Helpers, Hero } from '@ulixee/hero-testing';
import HeroCore, { Session } from '@ulixee/hero-core';

import TransportBridge from '@ulixee/net/lib/TransportBridge';
import HeroClient, { ConnectionToHeroCore } from '@ulixee/hero';

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

  it("doesn't automatically close an idle connection", async () => {
    const bridge = new TransportBridge();
    const connectionToCore = new ConnectionToHeroCore(bridge.transportToCore);
    HeroCore.addConnection(bridge.transportToClient);
    Helpers.onClose(() => connectionToCore.disconnect());
    const disconnectSpy = jest.spyOn(connectionToCore, 'disconnect');

    const heros: HeroClient[] = [];
    for (let i = 0; i <= 3; i += 1) {
      const hero = new HeroClient({ connectionToCore });
      heros.push(hero);
      Helpers.needsClosing.push(hero);
      await hero.goto(koaServer.baseUrl);
      await hero.waitForLoad('DomContentLoaded');
    }

    await Promise.all(heros.map(x => x.close()));

    await new Promise(resolve => setTimeout(resolve, 600));
    expect(disconnectSpy).toHaveBeenCalledTimes(0);

    const hero = new HeroClient({ connectionToCore });
    heros.push(hero);
    Helpers.needsClosing.push(hero);
    await expect(hero.goto(koaServer.baseUrl)).resolves.toBeTruthy();
    await hero.waitForLoad('DomContentLoaded');
    await hero.close();
    expect(disconnectSpy).toHaveBeenCalledTimes(0);
  });

  it('can provide a sessionId', async () => {
    const hero = new Hero({ sessionId: 'session1' });
    Helpers.needsClosing.push(hero);
    expect(await hero.sessionId).toBe('session1');
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
    // test deleting a subdomain cookie
    await cookieStorage.removeItem('Cookie1');
    expect(await cookieStorage.length).toBe(0);
  });

  it('can get and set subdomain cookies', async () => {
    const hero = new Hero();
    Helpers.needsClosing.push(hero);

    const session = Session.get(await hero.sessionId);
    session.agent.mitmRequestSession.interceptorHandlers.push({
      urls: ['https://ulixee.org'],
      handlerFn(url, type, request, response) {
        response.setHeader('Set-Cookie', [
          'CookieMain=main; httpOnly',
          'CookieSub=sub; domain=.ulixee.org',
        ]);
        response.end(`<html lang='en'>
<body>
<h1>Page Title</h1>
</body>
</html>`);
        return true;
      },
    });

    await hero.goto(`https://ulixee.org`);
    const cookieStorage = hero.activeTab.cookieStorage;
    {
      expect(await cookieStorage.length).toBe(2);
      const cookie = await cookieStorage.getItem('CookieMain');
      expect(cookie.expires).toBe(undefined);
      expect(cookie.httpOnly).toBe(true);
      const cookieSub = await cookieStorage.getItem('CookieSub');
      expect(cookieSub.expires).toBe(undefined);
      expect(cookieSub.domain).toBe('.ulixee.org');
      // httponly not in doc
      const documentCookies = await hero.getJsValue('document.cookie');
      expect(documentCookies).toBe('CookieSub=sub');
    }
    // test deleting a subdomain cookie
    await cookieStorage.removeItem('CookieSub');
    expect(await cookieStorage.length).toBe(1);
    await cookieStorage.removeItem('CookieMain');
    expect(await cookieStorage.length).toBe(0);
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
