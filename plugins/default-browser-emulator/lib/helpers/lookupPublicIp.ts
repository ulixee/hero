import * as http from 'http';
import { RequestOptions } from 'http';
import * as https from 'https';
import * as url from 'url';
import IHttpSocketAgent from '@ulixee/unblocked-specification/agent/net/IHttpSocketAgent';
import IHttpSocketWrapper from '@ulixee/unblocked-specification/agent/net/IHttpSocketWrapper';
import MitmSocket from '@ulixee/unblocked-agent-mitm-socket';
import MitmSocketSession from '@ulixee/unblocked-agent-mitm-socket/lib/MitmSocketSession';
import Logger from '@ulixee/commons/lib/Logger';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import * as http2 from 'http2';

let sharedSession: MitmSocketSession;
let cachedMachineIp: string;

const { log } = Logger(module);

export default async function lookupPublicIp(
  ipLookupServiceUrl: string = IpLookupServices.ipify,
  agent?: IHttpSocketAgent,
  proxyUrl?: string,
): Promise<string> {
  if (cachedMachineIp && !proxyUrl && !agent) return cachedMachineIp;

  if (!ipLookupServiceUrl.startsWith('http')) ipLookupServiceUrl = `https://${ipLookupServiceUrl}`;
  if (proxyUrl && proxyUrl.startsWith('http')) {
    // require https for lookup services over http proxies
    ipLookupServiceUrl.replace('http://', 'https://');
  }
  const parseLookupServiceUrl = parse(ipLookupServiceUrl);
  const port = parseLookupServiceUrl.port ?? parseLookupServiceUrl.protocol === 'https:' ? 443 : 80;

  const requestOptions: http.RequestOptions = {
    method: 'GET',
  };
  let socketWrapper: IHttpSocketWrapper;
  const socketOptions = {
    host: parseLookupServiceUrl.host,
    port: String(port),
    servername: parseLookupServiceUrl.host,
    keepAlive: false,
    isSsl: ipLookupServiceUrl.startsWith('https'),
    proxyUrl,
  };

  // create a temp agent if not using a MITM
  if (proxyUrl && !agent) {
    if (!sharedSession) {
      sharedSession = new MitmSocketSession(log, {
        rejectUnauthorized: false,
      });
      ShutdownHandler.register(() => sharedSession.close());
    }
    socketWrapper = new MitmSocket(`session${ipLookupServiceUrl}`, log, socketOptions);
  }

  if (agent) {
    socketWrapper = await agent.createSocketConnection(socketOptions);
  }

  if (socketWrapper?.isHttp2()) {
    const h2Client = http2.connect(`https://${parseLookupServiceUrl.host}`, {
      createConnection: () => socketWrapper.socket,
    });
    try {
      const ip = await http2Get(parseLookupServiceUrl.path, h2Client);
      if (!proxyUrl && !agent) cachedMachineIp = ip;
      return ip;
    } finally {
      h2Client.close();
      socketWrapper?.close();
    }
  }

  try {
    if (socketWrapper) {
      requestOptions.createConnection = () => socketWrapper.socket;
      requestOptions.agent = null;
    }

    const ip = await httpGet(ipLookupServiceUrl, requestOptions);
    if (!proxyUrl && !agent) cachedMachineIp = ip;
    return ip;
  } finally {
    if (socketWrapper) socketWrapper.close();
  }
}

export function httpGet(requestUrl: string, requestOptions: RequestOptions): Promise<string> {
  const httpModule = requestUrl.startsWith('https') ? https : http;

  return new Promise<string>((resolve, reject) => {
    const request = httpModule.request(requestUrl, requestOptions, async res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpGet(res.headers.location, requestOptions));
        return;
      }

      res.on('error', reject);
      res.setEncoding('utf8');
      let result = '';
      for await (const chunk of res) {
        result += chunk;
      }
      resolve(result);
    });
    request.on('error', reject);
    request.end();
  });
}

export async function http2Get(path: string, h2Client: http2.ClientHttp2Session): Promise<string> {
  const res = await h2Client.request({ ':path': path });

  res.setEncoding('utf8');
  let result = '';
  for await (const chunk of res) {
    result += chunk;
  }
  return result;
}

const parsedLookupServicesByUrl = new Map<string, RequestOptions>();
function parse(requestUrl: string): RequestOptions {
  if (!parsedLookupServicesByUrl.has(requestUrl)) {
    const options = url.parse(requestUrl);
    options.port ||= requestUrl.startsWith('https') ? '443' : '80';

    parsedLookupServicesByUrl.set(requestUrl, options);
  }
  return parsedLookupServicesByUrl.get(requestUrl);
}

export const IpLookupServices = {
  ipify: 'api.ipify.org',
  icanhazip: 'icanhazip.com', // warn: using cloudflare as of 11/19/21
  aws: 'checkip.amazonaws.com',
  identMe: 'ident.me',
  ifconfigMe: 'ifconfig.me/ip',
  ipecho: 'ipecho.net/plain',
  ipinfo: 'ipinfo.io/ip',
  opendns: 'diagnostic.opendns.com/myip',
};
