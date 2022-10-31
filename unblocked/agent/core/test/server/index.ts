/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as http from 'http';
import { IncomingMessage } from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as Path from 'path';
import { AddressInfo, Socket } from 'net';
import { createGzip } from 'zlib';
import Log from '@ulixee/commons/lib/Logger';

const { log } = Log(module);
const fulfillSymbol = Symbol('fulfill callback');
const rejectSymbol = Symbol('reject callback');

export class TestServer {
  public baseUrl: string;
  public crossProcessBaseUrl: string;
  public get emptyPage() {
    return this.url('empty.html');
  }

  private readonly server: http.Server | https.Server;
  private readonly dirPath = Path.resolve(__dirname, '../assets');
  private startTime: Date;
  private sockets = new Set<Socket>();
  private cachedPathPrefix: string;
  private routes = new Map<string, http.RequestListener>();
  private auths = new Map<string, { username: string; password: string }>();
  private csp = new Map<string, string>();
  private gzipRoutes = new Set<string>();
  private requestSubscribers = new Map<string, Promise<IncomingMessage>>();
  private readonly protocol: string = 'http:';
  private port: number;

  constructor(sslOptions?: https.ServerOptions) {
    if (sslOptions) {
      this.server = https.createServer(sslOptions, this.onRequest.bind(this));
      this.protocol = 'https:';
    } else this.server = http.createServer(this.onRequest.bind(this));
    this.server.on('connection', socket => this.onSocket(socket));
    this.startTime = new Date();
    this.cachedPathPrefix = null;
  }

  public url(path: string) {
    return `${this.baseUrl}/${path}`;
  }

  start(preferredPort: number) {
    return new Promise<void>(resolve => {
      this.server.listen(preferredPort, () => {
        const protocol = this.protocol;
        const port = (this.server.address() as AddressInfo).port;
        this.port = port;
        this.baseUrl = `${protocol}//localhost:${port}`;
        this.crossProcessBaseUrl = `${protocol}//127.0.0.1:${port}`;
        resolve();
      });
    });
  }

  onSocket(socket: Socket) {
    this.sockets.add(socket);
    // ECONNRESET is a legit error given
    // that tab closing simply kills process.
    socket.on('error', error => {
      if ((error as any).code !== 'ECONNRESET') throw error;
    });
    socket.once('close', () => this.sockets.delete(socket));
  }

  enableGzip(path: string) {
    this.gzipRoutes.add(path);
  }

  setCSP(path: string, csp: string) {
    this.csp.set(path, csp);
  }

  async stop() {
    this.reset();
    for (const socket of this.sockets) socket.destroy();
    this.sockets.clear();
    await new Promise(resolve => this.server.close(resolve));
  }

  setRoute(path: string, handler: http.RequestListener) {
    this.routes.set(path, handler);
  }

  setRedirect(from: string, to: string) {
    this.setRoute(from, (req, res) => {
      res.writeHead(302, { location: to });
      res.end();
    });
  }

  waitForRequest(path: string) {
    let promise = this.requestSubscribers.get(path);
    if (promise) return promise;
    let fulfill;
    let onreject;
    promise = new Promise<IncomingMessage>((resolve, reject) => {
      fulfill = resolve;
      onreject = reject;
    });
    promise[fulfillSymbol] = fulfill;
    promise[rejectSymbol] = onreject;
    this.requestSubscribers.set(path, promise);
    return promise;
  }

  reset() {
    this.routes.clear();
    this.auths.clear();
    this.csp.clear();
    this.gzipRoutes.clear();
    const error = new Error('Static Server has been reset');
    for (const subscriber of this.requestSubscribers.values())
      subscriber[rejectSymbol].call(null, error);
    this.requestSubscribers.clear();
  }

  onRequest(request: http.IncomingMessage, response: http.ServerResponse) {
    request.on('error', error => {
      if ((error as any).code === 'ECONNRESET') response.end();
      else throw error;
    });
    const pathName = url.parse(request.url).path;
    log.stats(`OnRequest: ${request.method} ${pathName}`);
    if (this.auths.has(pathName)) {
      const auth = this.auths.get(pathName);
      const credentials = Buffer.from(
        (request.headers.authorization || '').split(' ')[1] || '',
        'base64',
      ).toString();
      if (credentials !== `${auth.username}:${auth.password}`) {
        response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
        response.end('HTTP Error 401 Unauthorized: Access is denied');
        return;
      }
    }
    // Notify request subscriber.
    if (this.requestSubscribers.has(pathName)) {
      this.requestSubscribers.get(pathName)[fulfillSymbol].call(null, request);
      this.requestSubscribers.delete(pathName);
    }
    response.cork();
    const handler = this.routes.get(pathName);
    if (handler) {
      handler.call(null, request, response);
    } else {
      this.serveFile(request, response);
    }
  }

  serveFile(request: http.IncomingMessage, response: http.ServerResponse, filePath?: string) {
    let pathName = url.parse(request.url).path;
    if (!filePath) {
      if (pathName === '/') pathName = '/index.html';
      filePath = Path.join(this.dirPath, pathName.substring(1));
    }

    if (this.cachedPathPrefix !== null && filePath.startsWith(this.cachedPathPrefix)) {
      if (request.headers['if-modified-since']) {
        response.statusCode = 304; // not modified
        response.end();
        return;
      }
      response.setHeader('Cache-Control', 'public, max-age=31536000, no-cache');
      response.setHeader('Last-Modified', this.startTime.toISOString());
    } else {
      response.setHeader('Cache-Control', 'no-cache, no-store');
    }
    if (this.csp.has(pathName))
      response.setHeader('Content-Security-Policy', this.csp.get(pathName));

    if (!fs.existsSync(filePath)) {
      response.statusCode = 404;
      response.end(`File not found: ${filePath}`);
      return;
    }

    const extension = filePath.substring(filePath.lastIndexOf('.') + 1);
    const mimeType = extensionToMime[extension] || 'application/octet-stream';
    const isTextEncoding = /^text\/|^application\/(javascript|json)/.test(mimeType);
    const contentType = isTextEncoding ? `${mimeType}; charset=utf-8` : mimeType;
    response.setHeader('Content-Type', contentType);

    if (this.gzipRoutes.has(pathName)) response.setHeader('Content-Encoding', 'gzip');

    const stream = fs.createReadStream(filePath, { autoClose: true });
    if (this.gzipRoutes.has(pathName)) {
      stream.pipe(createGzip()).pipe(response);
    } else {
      stream.pipe(response);
    }
  }

  static async create(port: number) {
    const server = new TestServer();
    await server.start(port);
    return server;
  }

  static async createHTTPS(port: number) {
    const server = new TestServer({
      key: fs.readFileSync(Path.join(__dirname, 'key.pem')),
      cert: fs.readFileSync(Path.join(__dirname, 'cert.pem')),
      passphrase: 'aaaa',
    });
    await server.start(port);
    return server;
  }
}

const extensionToMime = {
  ai: 'application/postscript',
  apng: 'image/apng',
  appcache: 'text/cache-manifest',
  au: 'audio/basic',
  bmp: 'image/bmp',
  cer: 'application/pkix-cert',
  cgm: 'image/cgm',
  coffee: 'text/coffeescript',
  conf: 'text/plain',
  crl: 'application/pkix-crl',
  css: 'text/css',
  csv: 'text/csv',
  def: 'text/plain',
  doc: 'application/msword',
  dot: 'application/msword',
  drle: 'image/dicom-rle',
  dtd: 'application/xml-dtd',
  ear: 'application/java-archive',
  emf: 'image/emf',
  eps: 'application/postscript',
  exr: 'image/aces',
  fits: 'image/fits',
  g3: 'image/g3fax',
  gbr: 'application/rpki-ghostbusters',
  gif: 'image/gif',
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  gz: 'application/gzip',
  h261: 'video/h261',
  h263: 'video/h263',
  h264: 'video/h264',
  heic: 'image/heic',
  heics: 'image/heic-sequence',
  heif: 'image/heif',
  heifs: 'image/heif-sequence',
  htm: 'text/html',
  html: 'text/html',
  ics: 'text/calendar',
  ief: 'image/ief',
  ifb: 'text/calendar',
  iges: 'model/iges',
  igs: 'model/iges',
  in: 'text/plain',
  ini: 'text/plain',
  jade: 'text/jade',
  jar: 'application/java-archive',
  jls: 'image/jls',
  jp2: 'image/jp2',
  jpe: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpf: 'image/jpx',
  jpg: 'image/jpeg',
  jpg2: 'image/jp2',
  jpgm: 'video/jpm',
  jpgv: 'video/jpeg',
  jpm: 'image/jpm',
  jpx: 'image/jpx',
  js: 'application/javascript',
  json: 'application/json',
  json5: 'application/json5',
  jsx: 'text/jsx',
  jxr: 'image/jxr',
  kar: 'audio/midi',
  ktx: 'image/ktx',
  less: 'text/less',
  list: 'text/plain',
  litcoffee: 'text/coffeescript',
  log: 'text/plain',
  m1v: 'video/mpeg',
  m21: 'application/mp21',
  m2a: 'audio/mpeg',
  m2v: 'video/mpeg',
  m3a: 'audio/mpeg',
  m4a: 'audio/mp4',
  m4p: 'application/mp4',
  man: 'text/troff',
  manifest: 'text/cache-manifest',
  markdown: 'text/markdown',
  mathml: 'application/mathml+xml',
  md: 'text/markdown',
  mdx: 'text/mdx',
  me: 'text/troff',
  mesh: 'model/mesh',
  mft: 'application/rpki-manifest',
  mid: 'audio/midi',
  midi: 'audio/midi',
  mj2: 'video/mj2',
  mjp2: 'video/mj2',
  mjs: 'application/javascript',
  mml: 'text/mathml',
  mov: 'video/quicktime',
  mp2: 'audio/mpeg',
  mp21: 'application/mp21',
  mp2a: 'audio/mpeg',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mp4a: 'audio/mp4',
  mp4s: 'application/mp4',
  mp4v: 'video/mp4',
  mpe: 'video/mpeg',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  mpg4: 'video/mp4',
  mpga: 'audio/mpeg',
  mrc: 'application/marc',
  ms: 'text/troff',
  msh: 'model/mesh',
  n3: 'text/n3',
  oga: 'audio/ogg',
  ogg: 'audio/ogg',
  ogv: 'video/ogg',
  ogx: 'application/ogg',
  otf: 'font/otf',
  p10: 'application/pkcs10',
  p7c: 'application/pkcs7-mime',
  p7m: 'application/pkcs7-mime',
  p7s: 'application/pkcs7-signature',
  p8: 'application/pkcs8',
  pdf: 'application/pdf',
  pki: 'application/pkixcmp',
  pkipath: 'application/pkix-pkipath',
  png: 'image/png',
  ps: 'application/postscript',
  pskcxml: 'application/pskc+xml',
  qt: 'video/quicktime',
  rmi: 'audio/midi',
  rng: 'application/xml',
  roa: 'application/rpki-roa',
  roff: 'text/troff',
  rsd: 'application/rsd+xml',
  rss: 'application/rss+xml',
  rtf: 'application/rtf',
  rtx: 'text/richtext',
  s3m: 'audio/s3m',
  sgi: 'image/sgi',
  sgm: 'text/sgml',
  sgml: 'text/sgml',
  shex: 'text/shex',
  shtml: 'text/html',
  sil: 'audio/silk',
  silo: 'model/mesh',
  slim: 'text/slim',
  slm: 'text/slim',
  snd: 'audio/basic',
  spx: 'audio/ogg',
  stl: 'model/stl',
  styl: 'text/stylus',
  stylus: 'text/stylus',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  t: 'text/troff',
  t38: 'image/t38',
  text: 'text/plain',
  tfx: 'image/tiff-fx',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  tr: 'text/troff',
  ts: 'video/mp2t',
  tsv: 'text/tab-separated-values',
  ttc: 'font/collection',
  ttf: 'font/ttf',
  ttl: 'text/turtle',
  txt: 'text/plain',
  uri: 'text/uri-list',
  uris: 'text/uri-list',
  urls: 'text/uri-list',
  vcard: 'text/vcard',
  vrml: 'model/vrml',
  vtt: 'text/vtt',
  war: 'application/java-archive',
  wasm: 'application/wasm',
  wav: 'audio/wav',
  weba: 'audio/webm',
  webm: 'video/webm',
  webmanifest: 'application/manifest+json',
  webp: 'image/webp',
  wmf: 'image/wmf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  wrl: 'model/vrml',
  x3d: 'model/x3d+xml',
  x3db: 'model/x3d+fastinfoset',
  x3dbz: 'model/x3d+binary',
  x3dv: 'model/x3d-vrml',
  x3dvz: 'model/x3d+vrml',
  x3dz: 'model/x3d+xml',
  xaml: 'application/xaml+xml',
  xht: 'application/xhtml+xml',
  xhtml: 'application/xhtml+xml',
  xm: 'audio/xm',
  xml: 'text/xml',
  xsd: 'application/xml',
  xsl: 'application/xml',
  xslt: 'application/xslt+xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  zip: 'application/zip',
};
