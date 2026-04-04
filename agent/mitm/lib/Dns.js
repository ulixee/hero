"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dns = void 0;
const moment = require("moment");
const net = require("net");
const dns_1 = require("dns");
const utils_1 = require("@ulixee/commons/lib/utils");
const DnsOverTlsSocket_1 = require("./DnsOverTlsSocket");
class Dns {
    constructor(requestSession) {
        this.requestSession = requestSession;
        this.dnsSettings = {};
        if (requestSession) {
            for (const hook of requestSession.hooks) {
                hook.onDnsConfiguration?.(this.dnsSettings);
            }
        }
    }
    async lookupIp(host, retries = 3) {
        // if this is an upstream proxy requesting upstream lookup, don't resolve dns
        if (this.requestSession.upstreamProxyUrl && !this.requestSession.upstreamProxyUseSystemDns)
            return host;
        if (host === 'localhost' || net.isIP(host))
            return host;
        try {
            // get cached (or in process resolver)
            const cachedRecord = await this.getNextCachedARecord(host);
            if (cachedRecord)
                return cachedRecord;
        }
        catch (error) {
            if (retries === 0)
                throw error;
            // if the cache lookup failed, likely because another lookup failed... try again
            return this.lookupIp(host, retries - 1);
        }
        // if not found in cache, perform dns lookup
        let lookupError;
        try {
            if (this.dnsSettings.dnsOverTlsConnection) {
                const dnsEntry = await this.lookupDnsEntry(host);
                const ip = this.nextIp(dnsEntry);
                if (ip)
                    return ip;
            }
        }
        catch (error) {
            lookupError = error;
        }
        // try to resolve using system interface
        try {
            const dnsEntry = await this.systemLookup(host);
            return this.nextIp(dnsEntry);
        }
        catch (error) {
            // don't throw error, throw original error
            throw lookupError;
        }
    }
    close() {
        this.socket?.close();
        this.socket = null;
        this.requestSession = null;
    }
    async systemLookup(host) {
        const dnsEntry = (0, utils_1.createPromise)(10e3);
        void this.doSystemLookup(host, dnsEntry).then(() => null);
        return await dnsEntry.promise;
    }
    async doSystemLookup(host, dnsEntry) {
        try {
            Dns.dnsEntries.set(host, dnsEntry);
            const lookupAddresses = await dns_1.promises.lookup(host.split(':').shift(), {
                all: true,
                family: 4,
            });
            const entry = {
                aRecords: lookupAddresses.map(x => ({
                    expiry: moment().add(10, 'minutes').toDate(),
                    ip: x.address,
                })),
            };
            dnsEntry.resolve(entry);
        }
        catch (error) {
            dnsEntry.reject(error);
            Dns.dnsEntries.delete(host);
        }
    }
    async lookupDnsEntry(host) {
        const existing = Dns.dnsEntries.get(host);
        if (existing && !existing.isResolved)
            return existing.promise;
        this.socket ??= new DnsOverTlsSocket_1.default(this.dnsSettings, this.requestSession, () => (this.socket = null));
        const dnsEntry = (0, utils_1.createPromise)(10e3);
        // don't wait for promise... allow timeout
        void this.doLookupDnsOverTls(host, dnsEntry).then(() => null);
        return await dnsEntry.promise;
    }
    async doLookupDnsOverTls(host, dnsEntry) {
        try {
            Dns.dnsEntries.set(host, dnsEntry);
            const response = await this.socket.lookupARecords(host);
            const entry = {
                aRecords: response.answers
                    .filter(x => x.type === 'A') // gives non-query records sometimes
                    .map(x => ({
                    ip: x.data,
                    expiry: moment().add(x.ttl, 'seconds').toDate(),
                })),
            };
            dnsEntry.resolve(entry);
        }
        catch (error) {
            dnsEntry.reject(error);
            Dns.dnsEntries.delete(host);
        }
    }
    nextIp(dnsEntry) {
        // implement rotating
        for (let i = 0; i < dnsEntry.aRecords.length; i += 1) {
            const record = dnsEntry.aRecords[i];
            if (record.expiry > new Date()) {
                // move record to back
                dnsEntry.aRecords.splice(i, 1);
                dnsEntry.aRecords.push(record);
                return record.ip;
            }
        }
        return null;
    }
    async getNextCachedARecord(name) {
        const cached = await Dns.dnsEntries.get(name)?.promise;
        if (cached?.aRecords?.length) {
            return this.nextIp(cached);
        }
        return null;
    }
}
exports.Dns = Dns;
Dns.dnsEntries = new Map();
//# sourceMappingURL=Dns.js.map