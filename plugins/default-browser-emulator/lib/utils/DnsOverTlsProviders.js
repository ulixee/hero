"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenDnsAlternate = exports.OpenDns = exports.Quad9Alternate = exports.Quad9 = exports.GoogleAlternate = exports.Google = exports.Cloudflare = void 0;
const Cloudflare = {
    host: '1.1.1.1',
    servername: 'cloudflare-dns.com',
};
exports.Cloudflare = Cloudflare;
const Google = {
    host: '8.8.8.8',
    servername: 'dns.google',
};
exports.Google = Google;
const GoogleAlternate = {
    host: '8.8.4.4',
    servername: 'dns.google',
};
exports.GoogleAlternate = GoogleAlternate;
const Quad9 = {
    host: '9.9.9.9',
    servername: 'dns.quad9.net',
};
exports.Quad9 = Quad9;
const Quad9Alternate = {
    host: '149.112.112.112',
    servername: 'dns.quad9.net',
};
exports.Quad9Alternate = Quad9Alternate;
const OpenDns = {
    host: '208.67.222.222',
    servername: 'dns.opendns.com',
};
exports.OpenDns = OpenDns;
const OpenDnsAlternate = {
    host: '208.67.220.220',
    servername: 'dns.opendns.com',
};
exports.OpenDnsAlternate = OpenDnsAlternate;
//# sourceMappingURL=DnsOverTlsProviders.js.map