import { URL } from 'url';
import Config from '@double-agent/config/index';

const { CrossDomain, MainDomain, SubDomain, TlsDomain } = Config.collect.domains;

export enum DomainType {
  MainDomain = 'MainDomain', // eslint-disable-line @typescript-eslint/no-shadow
  SubDomain = 'SubDomain', // eslint-disable-line @typescript-eslint/no-shadow
  TlsDomain = 'TlsDomain', // eslint-disable-line @typescript-eslint/no-shadow
  CrossDomain = 'CrossDomain', // eslint-disable-line @typescript-eslint/no-shadow
}

export function getDomainType(url: URL | string): DomainType {
  const host = typeof url === 'string' ? url : url.host;
  const domain = extractDomainFromHost(host);
  if (domain === MainDomain || domain === DomainType.MainDomain.toLowerCase()) {
    return DomainType.MainDomain;
  }
  if (domain === CrossDomain || domain === DomainType.CrossDomain.toLowerCase()) {
    return DomainType.CrossDomain;
  }
  if (domain === SubDomain || domain === DomainType.SubDomain.toLowerCase()) {
    return DomainType.SubDomain;
  }
  if (domain === TlsDomain || domain === DomainType.TlsDomain.toLowerCase()) {
    return DomainType.TlsDomain;
  }
  throw new Error(`Unknown domain type: ${domain}`);
}

export function isRecognizedDomain(host: string, recognizedDomains: string[]): boolean {
  const domain = extractDomainFromHost(host);
  return recognizedDomains.some((x) => x === domain);
}

export function addSessionIdToUrl(url: string, sessionId: string): string {
  if (!url) return url;
  const startUrl = new URL(url);
  startUrl.searchParams.set('sessionId', sessionId);
  return startUrl.href;
}

export function addPageIndexToUrl(url: string, pageIndex: number): string {
  if (!url) return url;
  const startUrl = new URL(url);
  startUrl.searchParams.set('pageIndex', pageIndex.toString());
  return startUrl.href;
}

export function cleanDomains(url: string): string {
  if (!url) return url;

  return url
    .replace(RegExp(SubDomain, 'g'), 'SubDomain')
    .replace(RegExp(MainDomain, 'g'), 'MainDomain')
    .replace(RegExp(CrossDomain, 'g'), 'CrossDomain');
}

function extractDomainFromHost(host: string): string {
  return host.split(':')[0];
}
