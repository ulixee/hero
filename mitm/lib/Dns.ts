import { createPromise, IResolvablePromise } from '@secret-agent/commons/utils';
import Log from '@secret-agent/commons/Logger';
import { ConnectionOptions } from 'tls';
import moment from 'moment';
import net from 'net';
import DnsOverTlsSocket from './DnsOverTlsSocket';
import RequestSession from '../handlers/RequestSession';

const { log } = Log(module);

export class Dns {
  public socket: DnsOverTlsSocket;
  public dnsEntries = new Map<string, IResolvablePromise<IDnsEntry>>();
  private readonly dnsServer: ConnectionOptions;

  constructor(readonly requestSession?: RequestSession) {
    this.dnsServer = requestSession?.delegate?.dnsOverTlsConnectOptions;
  }

  public async lookupIp(host: string, retries = 3) {
    if (!this.dnsServer || host === 'localhost' || net.isIP(host)) return host;

    try {
      // get cached (or in process resolver)
      const cachedRecord = await this.getNextCachedARecord(host);
      if (cachedRecord) return cachedRecord.ip;
    } catch (error) {
      if (retries === 0) throw error;
      // if the cache lookup failed, likely because another lookup failed... try again
      return this.lookupIp(host, retries - 1);
    }

    // if not found in cache, perform dns lookup
    try {
      const dnsEntry = await this.lookupDnsEntry(host);
      return this.nextIp(dnsEntry);
    } catch (error) {
      log.error('DnsLookup.Error', {
        sessionId: this.requestSession.sessionId,
        error,
      });
      // fallback to host
      return host;
    }
  }

  public close() {
    this.socket?.close();
  }

  private async lookupDnsEntry(host: string) {
    const existing = this.dnsEntries.get(host);
    if (existing && !existing.isResolved) return existing.promise;

    try {
      const dnsEntry = createPromise<IDnsEntry>();
      this.dnsEntries.set(host, dnsEntry);

      if (!this.socket?.isActive) {
        this.socket = new DnsOverTlsSocket(
          this.dnsServer,
          this.requestSession,
          () => (this.socket = null),
        );
      }

      const response = await this.socket.lookupARecords(host);

      const entry = <IDnsEntry>{
        aRecords: response.answers
          .filter(x => x.type === 'A') // gives non-query records sometimes
          .map(x => ({
            ip: x.data,
            expiry: moment()
              .add(x.ttl, 'seconds')
              .toDate(),
          })),
      };
      dnsEntry.resolve(entry);
      return entry;
    } catch (error) {
      this.dnsEntries.get(host)?.reject(error);
      this.dnsEntries.delete(host);
      throw error;
    }
  }

  private nextIp(dnsEntry: IDnsEntry) {
    // implement rotating
    for (let i = 0; i < dnsEntry.aRecords.length; i += 1) {
      const record = dnsEntry.aRecords[i];
      if (record.expiry > new Date()) {
        // move record to back
        dnsEntry.aRecords.splice(i, 1);
        dnsEntry.aRecords.push(record);
        return record;
      }
    }
    return null;
  }

  private async getNextCachedARecord(name: string) {
    const cached = await this.dnsEntries.get(name)?.promise;
    if (cached?.aRecords?.length) {
      return this.nextIp(cached);
    }
    return null;
  }
}

interface IDnsEntry {
  aRecords: { ip: string; expiry: Date }[];
}
