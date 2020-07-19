import * as Fs from 'fs';
import * as Path from 'path';
import Url, { URL } from 'url';
import querystring from 'querystring';
import Log from '@secret-agent/commons/Logger';
import http, { IncomingMessage } from 'http';
import https from 'https';
import { createPromise } from '@secret-agent/commons/utils';
import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import Koa from 'koa';
import KoaRouter from '@koa/router';
import Core from '../core';

const { log } = Log(module);

export const needsClosing = [];
let lastPort = 4000;

export interface ITestKoaServer extends KoaRouter {
  close: () => void;
  server: http.Server;
  koa: Koa;
  isClosing?: boolean;
  baseHost: string;
  baseUrl: string;
}

export async function runKoaServer(): Promise<ITestKoaServer> {
  const port = reservePort();
  const koa = new Koa();
  const router = new KoaRouter() as ITestKoaServer;
  const exampleOrgPath = Path.join(__dirname, 'html', 'example.org.html');
  const exampleOrgHtml = Fs.readFileSync(exampleOrgPath, 'utf-8');

  koa.use(router.routes()).use(router.allowedMethods());
  const server = koa.listen(port).unref();

  router.baseHost = `localhost:${port}`;
  router.baseUrl = `http://${router.baseHost}`;

  router.get('/', (ctx, next) => {
    ctx.body = exampleOrgHtml;
  });

  router.close = () => {
    if (router.isClosing) {
      return;
    }
    router.isClosing = true;
    return new Promise(resolve => {
      server.close(() => {
        setTimeout(resolve, 10);
      });
    });
  };
  needsClosing.push(router);
  router.koa = koa;
  router.server = server;

  return router;
}

export async function runHttpServer(
  cookieValue?: string,
  onPost?: (data: string) => void,
  onRequest?: (url: string, method: string, headers: http.IncomingHttpHeaders) => void,
) {
  const port = reservePort();
  const server = http.createServer().unref();
  server.on('request', async (request, response) => {
    if (onRequest) onRequest(request.url, request.method, request.headers);
    if (cookieValue) {
      response.writeHead(200, {
        'Set-Cookie': cookieValue,
      });
    }
    let pageBody = 'Hello';
    const requestUrl = Url.parse(request.url);
    if (requestUrl.pathname === '/') {
      return response.end(`<html><head></head><body>Hello world</body></html>`);
    }
    if (requestUrl.pathname === '/page1') {
      if (request.method === 'OPTIONS') {
        response.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'X-Custom-Header',
        });
        return response.end('');
      }
      return response.end(
        `<html><head></head><body>
<form action="/page2" method="post"><input type="text" id="input" name="thisText"/><input type="submit" id="submit-button" name="submit"/></form>
</body></html>`,
      );
    }
    if (requestUrl.pathname === '/page2' && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      const params = querystring.parse(body);
      pageBody = params.thisText as string;
      if (onPost) onPost(params.thisText as string);
    }
    response.end(`<html><head></head><body>${pageBody}</body></html>`);
  });
  server.listen(port);

  const baseUrl = `http://localhost:${port}`;
  const httpServer: any = {
    on(eventName, fn) {
      server.on(eventName, fn);
    },
    async close() {
      if (httpServer.isClosing) {
        return null;
      }
      httpServer.isClosing = true;
      return new Promise(resolve => {
        server.close(() => setTimeout(resolve, 10));
      });
    },
    baseUrl,
    url: `${baseUrl}/`,
    port,
    server,
  };

  needsClosing.push(httpServer);

  return httpServer;
}

export function httpRequest(
  urlStr: string,
  method: string,
  proxyHost: string,
  headers: { [name: string]: string } = {},
  response?: (res: IncomingMessage) => any,
  postData?: Buffer,
) {
  const createdPromise = createPromise();
  const { promise, resolve, reject } = createdPromise;
  const url = new URL(urlStr);
  const urlPort = extractPort(url);
  const urlPath = [url.pathname, url.search].join('');
  const options: any = {
    host: url.hostname,
    port: urlPort,
    method,
    path: urlPath,
    headers: headers || {},
    rejectUnauthorized: false,
  };

  if (proxyHost) {
    // tslint:disable-next-line:variable-name
    const ProxyAgent = url.protocol === 'https:' ? HttpsProxyAgent : HttpProxyAgent;
    options.agent = new ProxyAgent(proxyHost);
  }

  const client = url.protocol === 'https:' ? https : http;
  const req = client.request(options, async res => {
    if (createdPromise.isResolved) return;
    let data = '';
    if (response) response(res);
    res.on('end', () => resolve(data));
    res.on('data', chunk => (data += chunk));
  });
  req.on('error', reject);
  if (postData) req.write(postData);
  req.end();

  return promise;
}

export function httpGet(
  urlStr: string,
  proxyHost: string,
  headers: { [name: string]: string } = {},
) {
  return httpRequest(urlStr, 'GET', proxyHost, headers);
}

export async function closeAll() {
  while (needsClosing.length) {
    const toClose = needsClosing.pop();
    if (!toClose.close) log.warn(null, toClose);
    await toClose.close();
  }
  await Core.shutdown();
  log.flush();
}

export function onClose(closeFn: () => Promise<any>) {
  needsClosing.push({ close: closeFn });
}

export function reservePort() {
  return reservePorts(1)[0];
}

// local helper functions

function reservePorts(count = 20) {
  const minPort = (lastPort += 1); // eslint-disable-line no-multi-assign
  const maxPort = (lastPort += count); // eslint-disable-line no-multi-assign
  return [minPort, maxPort];
}

function extractPort(url: URL) {
  if (url.port) return url.port;
  if (url.protocol === 'https:') return 443;
  return 80;
}
