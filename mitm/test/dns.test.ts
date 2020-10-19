import IHttpRequestModifierDelegate from "@secret-agent/commons/interfaces/IHttpRequestModifierDelegate";
import DnsOverTlsSocket from "../lib/DnsOverTlsSocket";
import { Dns } from "../lib/Dns";
import RequestSession from "../handlers/RequestSession";

const CloudFlare = {
  host: '1.1.1.1',
  servername: 'cloudflare-dns.com',
};

const Google = {
  host: '8.8.8.8',
  servername: 'dns.google',
};

const Quad9 = {
  host: '9.9.9.9',
  servername: 'dns.quad9.net',
};

let dns: Dns;
beforeAll(() => {
  dns = new Dns({
    delegate: {
      tlsProfileId: 'Chrome83',
      dnsOverTlsConnectOptions: Quad9,
    } as IHttpRequestModifierDelegate,
    getUpstreamProxyUrl: () => null,
  } as RequestSession);
});

afterAll(() => {
  dns.close();
});

describe('DnsOverTlsSocket', () => {
  let cloudflareDnsSocket: DnsOverTlsSocket;
  beforeAll(() => {
    cloudflareDnsSocket = new DnsOverTlsSocket(CloudFlare);
  });
  afterAll(() => {
    cloudflareDnsSocket.close();
  });

  test('should be able to lookup dns records', async () => {
    const response = await cloudflareDnsSocket.lookupARecords('dataliberationfoundation.org');
    expect(response.answers).toHaveLength(1);
  });

  test('should be able to reuse the socket', async () => {
    const response = await cloudflareDnsSocket.lookupARecords('ulixee.org');
    expect(response.answers).toHaveLength(2);
  });

  test('should be able to lookup with google', async () => {
    let socket: DnsOverTlsSocket;
    try {
      socket = new DnsOverTlsSocket(Google);
      const response = await socket.lookupARecords('ulixee.org');
      expect(response.answers).toHaveLength(2);
    } finally {
      socket.close();
    }
  });
});

test('should cache and round robin results', async () => {
  const domain = 'stateofscraping.org';
  const spy = jest.spyOn<any, any>(dns, 'lookupDnsEntry');
  const ip = await dns.lookupIp(domain);
  expect(ip).toBeTruthy();
  expect(dns.dnsEntries.get(domain).isResolved).toBeTruthy();

  const cached = await dns.dnsEntries.get(domain).promise;
  expect(cached.aRecords).toHaveLength(2);

  const ip2 = await dns.lookupIp(domain);
  expect(ip2).toBeTruthy();
  // should round robin
  expect(ip).not.toBe(ip2);
  expect(spy).toHaveBeenCalledTimes(1);
});
