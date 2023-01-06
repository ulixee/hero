import * as http from 'http';
import { RequestOptions } from 'http';
import * as https from 'https';
import * as url from 'url';
import IHttpSocketAgent from '@ulixee/unblocked-specification/agent/net/IHttpSocketAgent';
import IHttpSocketWrapper from '@ulixee/unblocked-specification/agent/net/IHttpSocketWrapper';

let cachedMachineIp: string;

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
  const lookupService = parse(ipLookupServiceUrl);
  const port = lookupService.port ?? lookupService.protocol === 'https:' ? 443 : 80;

  const requestOptions: http.RequestOptions = {
    method: 'GET',
  };
  let socketWrapper: IHttpSocketWrapper;
  if (agent) {
    socketWrapper = await agent.createSocketConnection({
      host: lookupService.host,
      port: String(port),
      servername: lookupService.host,
      keepAlive: false,
      isSsl: ipLookupServiceUrl.startsWith('https'),
      proxyUrl,
    });

    requestOptions.createConnection = () => socketWrapper.socket;
    requestOptions.agent = null;
  }

  try {
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
