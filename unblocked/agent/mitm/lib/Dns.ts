import *  as moment from 'moment';
import * as net from 'net';
import { promises as dns } from 'dns';
import { createPromise } from '@ulixee/commons/lib/utils';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import IDnsSettings from '@ulixee/unblocked-specification/agent/net/IDnsSettings';
import DnsOverTlsSocket from './DnsOverTlsSocket';
import RequestSession from '../handlers/RequestSession';

export class Dns {
  public static dnsEntries = new Map<string, IResolvablePromise<IDnsEntry>>();
  public socket: DnsOverTlsSocket;
  private readonly dnsSettings: IDnsSettings = {};

  constructor(private requestSession?: RequestSession) {
    if (requestSession) {
      for (const hook of requestSession.hooks) {
        hook.onDnsConfiguration?.(this.dnsSettings);
      }
    }
  }

  public async lookupIp(host: string, retries = 3): Promise<string> {
    // if this is an upstream proxy requesting upstream lookup, don't resolve dns
    if (this.requestSession.upstreamProxyUrl && !this.requestSession.upstreamProxyUseSystemDns)
      return host;
    if (host === 'localhost' || net.isIP(host)) return host;

    try {
      // get cached (or in process resolver)
      const cachedRecord = await this.getNextCachedARecord(host);
      if (cachedRecord) return cachedRecord;
    } catch (error) {
      if (retries === 0) throw error;
      // if the cache lookup failed, likely because another lookup failed... try again
      return this.lookupIp(host, retries - 1);
    }

    // if not found in cache, perform dns lookup
    let lookupError: Error;
    try {
      if (this.dnsSettings.dnsOverTlsConnection) {
        const dnsEntry = await this.lookupDnsEntry(host);
        const ip = this.nextIp(dnsEntry);
        if (ip) return ip;
      }
    } catch (error) {
      lookupError = error;
    }

    // try to resolve using system interface
    try {
      const dnsEntry = await this.systemLookup(host);
      return this.nextIp(dnsEntry);
    } catch (error) {
      // don't throw error, throw original error
      throw lookupError;
    }
  }

  public close(): void {
    this.socket?.close();
    this.socket = null;
    this.requestSession = null;
  }

  private async systemLookup(host: string): Promise<IDnsEntry> {
    const dnsEntry = createPromise<IDnsEntry>(10e3);
    void this.doSystemLookup(host, dnsEntry).then(() => null);
    return await dnsEntry.promise;
  }

  private async doSystemLookup(
    host: string,
    dnsEntry: IResolvablePromise<IDnsEntry>,
  ): Promise<void> {
    try {
      Dns.dnsEntries.set(host, dnsEntry);
      const lookupAddresses = await dns.lookup(host.split(':').shift(), {
        all: true,
        family: 4,
      });
      const entry = <IDnsEntry>{
        aRecords: lookupAddresses.map(x => ({
          expiry: moment().add(10, 'minutes').toDate(),
          ip: x.address,
        })),
      };
      dnsEntry.resolve(entry);
    } catch (error) {
      dnsEntry.reject(error);
      Dns.dnsEntries.delete(host);
    }
  }

  private async lookupDnsEntry(host: string): Promise<IDnsEntry> {
    const existing = Dns.dnsEntries.get(host);
    if (existing && !existing.isResolved) return existing.promise;

    this.socket ??= new DnsOverTlsSocket(
      this.dnsSettings,
      this.requestSession,
      () => (this.socket = null),
    );

    const dnsEntry = createPromise<IDnsEntry>(10e3);

    // don't wait for promise... allow timeout
    void this.doLookupDnsOverTls(host, dnsEntry).then(() => null);

    return await dnsEntry.promise;
  }

  private async doLookupDnsOverTls(
    host: string,
    dnsEntry: IResolvablePromise<IDnsEntry>,
  ): Promise<void> {
    try {
      Dns.dnsEntries.set(host, dnsEntry);
      const response = await this.socket.lookupARecords(host);
      const entry = <IDnsEntry>{
        aRecords: response.answers
          .filter(x => x.type === 'A') // gives non-query records sometimes
          .map(x => ({
            ip: x.data,
            expiry: moment().add(x.ttl, 'seconds').toDate(),
          })),
      };
      dnsEntry.resolve(entry);
    } catch (error) {
      dnsEntry.reject(error);
      Dns.dnsEntries.delete(host);
    }
  }

  private nextIp(dnsEntry: IDnsEntry): string {
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

  private async getNextCachedARecord(name: string): Promise<string> {
    const cached = await Dns.dnsEntries.get(name)?.promise;
    if (cached?.aRecords?.length) {
      return this.nextIp(cached);
    }
    return null;
  }
}

interface IDnsEntry {
  aRecords: { ip: string; expiry: Date }[];
}
