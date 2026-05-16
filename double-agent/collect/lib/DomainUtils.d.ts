import { URL } from 'url';
export declare enum DomainType {
    MainDomain = "MainDomain",// eslint-disable-line @typescript-eslint/no-shadow
    SubDomain = "SubDomain",// eslint-disable-line @typescript-eslint/no-shadow
    TlsDomain = "TlsDomain",// eslint-disable-line @typescript-eslint/no-shadow
    CrossDomain = "CrossDomain"
}
export declare function getDomainType(url: URL | string): DomainType;
export declare function isRecognizedDomain(host: string, recognizedDomains: string[]): boolean;
export declare function addSessionIdToUrl(url: string, sessionId: string): string;
export declare function addPageIndexToUrl(url: string, pageIndex: number): string;
export declare function cleanDomains(url: string): string;
