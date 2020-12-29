import { Helpers } from '@secret-agent/testing';
import Resource from '@secret-agent/client/lib/Resource';
import { Handler } from '../index';

let koaServer;
let handler: Handler;
beforeAll(async () => {
  handler = new Handler({ maxConcurrency: 1 });
  Helpers.onClose(() => handler.close(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Full Client tests', () => {
  it('runs goto', async () => {
    const exampleUrl = `${koaServer.baseUrl}/`;
    const agent = await handler.createAgent();
    Helpers.needsClosing.push(agent);

    await agent.goto(exampleUrl);
    const url = await agent.document.location.host;
    expect(url).toBe(koaServer.baseHost);
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

    const agent = await handler.createAgent({
      blockedResourceTypes: ['BlockAssets'],
    });
    Helpers.needsClosing.push(agent);

    const resources: Resource[] = [];
    await agent.activeTab.on('resource', event => resources.push(event));
    await agent.goto(`${koaServer.baseUrl}/block`);
    await agent.waitForAllContentLoaded();
    expect(resources).toHaveLength(3);
    for (const resource of resources) {
      const status = await resource.response.statusCode;
      if (resource.type === 'Document') expect(status).toBe(200);
      else expect(status).toBe(404);
    }
  });

  it('should get unreachable proxy errors in the client', async () => {
    const agent = await handler.createAgent({
      upstreamProxyUrl: koaServer.baseUrl,
    });
    Helpers.needsClosing.push(agent);
    await expect(agent.goto(`${koaServer.baseUrl}/`)).rejects.toThrow();
  });

  it('should get errors in dispatch', async () => {
    handler.dispatchAgent(
      async agent => {
        await agent.goto(`${koaServer.baseUrl}/`);
      },
      null,
      {
        upstreamProxyUrl: koaServer.baseUrl,
      },
    );

    await expect(handler.waitForAllDispatches()).rejects.toThrow();
  });

  it('runs goto with no document loaded', async () => {
    const agent = await handler.createAgent();
    Helpers.needsClosing.push(agent);
    const url = await agent.document.location.host;
    expect(url).toBe(null);
  });

  it('gets the resource back from a goto', async () => {
    const exampleUrl = `${koaServer.baseUrl}/`;
    const agent = await handler.createAgent({
      locale: 'en-US,en;q=0.9',
    });
    Helpers.needsClosing.push(agent);

    const resource = await agent.goto(exampleUrl);

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
    expect(await request.postData).toBe('');

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
    expect(await response.text()).toMatch('<h1>Example Domain</h1>');
  });

  it('can get and set cookies', async () => {
    const agent = await handler.createAgent();
    Helpers.needsClosing.push(agent);

    koaServer.get('/cookies', ctx => {
      ctx.cookies.set('Cookie1', 'This is a test', {
        httpOnly: true,
      });
      ctx.body = '';
    });

    await agent.goto(`${koaServer.baseUrl}/cookies`);
    const cookieStorage = agent.activeTab.cookieStorage;
    {
      expect(await cookieStorage.length).toBe(1);
      const cookie = await cookieStorage.getItem('Cookie1');
      expect(cookie.expires).toBe('-1');
      expect(cookie.httpOnly).toBe(true);
      // httponly not in doc
      const documentCookies = await agent.getJsValue('document.cookie');
      expect(documentCookies.value).toBe('');
    }
    {
      const expires = new Date();
      expires.setTime(new Date().getTime() + 10e3);
      await cookieStorage.setItem('Cookie2', 'test2', { expires });
      expect(await cookieStorage.length).toBe(2);
      const cookie = await cookieStorage.getItem('Cookie2');
      expect(Math.round(Number(cookie.expires))).toBe(expires.getTime());
      expect(cookie.httpOnly).toBe(false);

      const documentCookies = await agent.getJsValue('document.cookie');
      expect(documentCookies.value).toBe('Cookie2=test2');
    }
    // test deleting
    {
      await cookieStorage.removeItem('Cookie2');
      expect(await cookieStorage.length).toBe(1);
      const documentCookies = await agent.getJsValue('document.cookie');
      expect(documentCookies.value).toBe('');
    }
  });

  it('can get and set localStorage', async () => {
    const agent = await handler.createAgent();
    Helpers.needsClosing.push(agent);

    await agent.goto(`${koaServer.baseUrl}/`);
    const localStorage = agent.activeTab.localStorage;
    expect(await localStorage.length).toBe(0);
    await localStorage.setItem('Test1', 'here');
    expect(await localStorage.length).toBe(1);

    const { value } = await agent.getJsValue('localStorage.getItem("Test1")');
    expect(value).toBe('here');

    expect(await localStorage.key(0)).toBe('Test1');
    await localStorage.removeItem('Test1');
    expect(await localStorage.length).toBe(0);
  });
});
