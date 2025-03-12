"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const env_1 = require("@ulixee/unblocked-agent/env"); // eslint-disable-line import/no-extraneous-dependencies
const dns_1 = require("dns");
const RequestSession_1 = require("../handlers/RequestSession");
const Dns_1 = require("../lib/Dns");
const DnsOverTlsSocket_1 = require("../lib/DnsOverTlsSocket");
const CloudFlare = {
    host: '1.1.1.1',
    servername: 'cloudflare-dns.com',
};
const Google = {
    host: '8.8.8.8',
    servername: 'dns.google',
};
const Google2 = {
    host: '8.8.4.4',
    servername: 'dns.google',
};
const Quad9 = {
    host: '9.9.9.9',
    servername: 'dns.quad9.net',
};
// eslint-disable-next-line @typescript-eslint/naming-convention
const Quad9_2 = {
    host: '149.112.112.112',
    servername: 'dns.quad9.net',
};
const OpenDns = {
    host: '208.67.222.222',
    servername: 'dns.opendns.com',
};
const OpenDns2 = {
    host: '208.67.220.220',
    servername: 'dns.opendns.com',
};
class CustomPlugin {
    onTlsConfiguration(settings) {
        settings.tlsClientHelloId = env_1.default.defaultChromeId.replace('-0', '');
    }
    onDnsConfiguration(settings) {
        settings.dnsOverTlsConnection = CloudFlare;
    }
}
CustomPlugin.id = 'test';
let dns;
let requestSession;
beforeAll(() => {
    requestSession = new RequestSession_1.default('dns.test', new CustomPlugin(), unblocked_agent_testing_1.TestLogger.forTest(module));
    unblocked_agent_testing_1.Helpers.onClose(() => requestSession.close(), true);
    dns = new Dns_1.Dns(requestSession);
});
afterAll(() => {
    dns.close();
    return unblocked_agent_testing_1.Helpers.afterAll();
});
describe('DnsOverTlsSocket', () => {
    beforeEach(() => {
        unblocked_agent_testing_1.TestLogger.testNumber += 1;
    });
    let testDnsSocket;
    const dnsOverTlsConnection = (0, utils_1.pickRandom)([
        OpenDns,
        OpenDns2,
        CloudFlare,
        Google,
        Google2,
        Quad9,
        Quad9_2,
    ]);
    beforeAll(() => {
        testDnsSocket = new DnsOverTlsSocket_1.default({ dnsOverTlsConnection }, requestSession);
    });
    afterAll(() => {
        testDnsSocket.close();
    });
    test('should be able to lookup dns records and reuse the socket', async () => {
        const response = await testDnsSocket.lookupARecords('ulixee.org');
        expect(response.answers).toHaveLength(4);
        const response2 = await testDnsSocket.lookupARecords('ulixee.org');
        expect(response2.answers).toHaveLength(4);
    });
    test('should be able to lookup multiple records at once', async () => {
        const response = await Promise.all([
            testDnsSocket.lookupARecords('headers.ulixee.org'),
            testDnsSocket.lookupARecords('tls.ulixee.org'),
            testDnsSocket.lookupARecords('stateofscraping.org'),
        ]);
        expect(response).toHaveLength(3);
    });
    test('should be able to lookup with google', async () => {
        let socket;
        try {
            socket = new DnsOverTlsSocket_1.default({ dnsOverTlsConnection: Google }, requestSession);
            const response = await socket.lookupARecords('ulixee.org');
            expect(response.answers).toHaveLength(4);
        }
        finally {
            socket.close();
        }
    });
    test('should be able to lookup a record after a miss', async () => {
        const item1 = await testDnsSocket.lookupARecords('double-agent.collect');
        expect(item1).toBeTruthy();
        // @ts-ignore - trigger internal eof
        testDnsSocket.mitmSocket.emit('eof');
        const response = await Promise.all([
            testDnsSocket.lookupARecords('sub.double-agent.collect'),
            testDnsSocket.lookupARecords(' double-agent-external.collect'),
        ]);
        expect(response).toHaveLength(2);
    });
});
describe('basic', () => {
    beforeEach(() => {
        unblocked_agent_testing_1.TestLogger.testNumber += 1;
    });
    test('should cache and round robin results', async () => {
        const domain = 'stateofscraping.org';
        const spy = jest.spyOn(dns, 'lookupDnsEntry');
        const ip = await dns.lookupIp(domain);
        expect(ip).toBeTruthy();
        expect(Dns_1.Dns.dnsEntries.get(domain).isResolved).toBeTruthy();
        const cached = await Dns_1.Dns.dnsEntries.get(domain).promise;
        expect(cached.aRecords).toHaveLength(2);
        const ip2 = await dns.lookupIp(domain);
        expect(ip2).toBeTruthy();
        // should round robin
        expect(ip).not.toBe(ip2);
        expect(spy).toHaveBeenCalledTimes(1);
    });
    test('should lookup in the local machine if not found in DoT', async () => {
        const lookupSpy = jest.spyOn(dns_1.promises, 'lookup').mockImplementationOnce(async () => {
            return [
                {
                    address: '127.0.0.1',
                    family: 4,
                },
            ];
        });
        const domain = 'double-agent.collect';
        const systemLookupSpy = jest.spyOn(dns, 'systemLookup');
        const ip = await dns.lookupIp(domain);
        expect(ip).toBeTruthy();
        expect(Dns_1.Dns.dnsEntries.get(domain).isResolved).toBeTruthy();
        const cached = await Dns_1.Dns.dnsEntries.get(domain).promise;
        expect(cached.aRecords).toHaveLength(1);
        expect(lookupSpy).toHaveBeenCalledTimes(1);
        expect(systemLookupSpy).toHaveBeenCalledTimes(1);
    });
    test('should properly expose errors if nothing is found', async () => {
        const lookupSpy = jest.spyOn(dns_1.promises, 'lookup').mockClear();
        const dotLookup = jest
            .spyOn(dns, 'lookupDnsEntry')
            .mockClear()
            .mockImplementationOnce(() => {
            throw new Error('Not found');
        });
        const systemLookupSpy = jest.spyOn(dns, 'systemLookup').mockClear();
        let unhandledErrorCalled = false;
        const handler = () => {
            unhandledErrorCalled = true;
        };
        process.once('unhandledRejection', handler);
        try {
            await dns.lookupIp('not-real-123423423443433434343-fake-domain.com');
        }
        catch (error) {
            expect(error.message).toMatch('Not found');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(unhandledErrorCalled).toBe(false);
        expect(dotLookup).toHaveBeenCalledTimes(1);
        expect(lookupSpy).toHaveBeenCalledTimes(1);
        expect(systemLookupSpy).toHaveBeenCalledTimes(1);
        process.off('unhandledRejection', handler);
    });
});
//# sourceMappingURL=dns.test.js.map