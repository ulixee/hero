"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertsMessage = void 0;
exports.checkSetup = checkSetup;
exports.default = certs;
exports.tlsCerts = tlsCerts;
const Fs = require("fs");
const config_1 = require("@double-agent/config");
const { MainDomain, CrossDomain, SubDomain, TlsDomain } = config_1.default.collect.domains;
const certPath = config_1.default.collect.enableLetsEncrypt
    ? `/etc/letsencrypt/live/${MainDomain}`
    : `${__dirname}/../certs`;
exports.CertsMessage = `
1. Go to the collect/certs directory and run generate.sh
2. To run the https tests, you will need to install trusted certificates onto your machine.
   --> On a mac, click on certs/fullchain.pem and add to your System certs and then set Trust to "Secure Sockets Layer" -> Always Trust
   --> On windows... lmgtfy?? sorry..
3. Add the following entries to /etc/hosts if running locally:

127.0.0.1      ${MainDomain}
127.0.0.1      ${SubDomain}
127.0.0.1      ${CrossDomain}
127.0.0.1      ${TlsDomain}
  `;
const certsCache = {};
function checkSetup() {
    if (!Fs.existsSync(`${certPath}/privkey.pem`)) {
        throw new Error(`You haven't completed setup. You'll need SSL Certificates to run the servers!!\n\n${exports.CertsMessage}`);
    }
}
function certs() {
    checkSetup();
    certsCache.default ??= {
        key: Fs.readFileSync(`${certPath}/privkey.pem`),
        cert: Fs.readFileSync(`${certPath}/fullchain.pem`),
    };
    return certsCache.default;
}
const tlsCertsPath = config_1.default.collect.enableLetsEncrypt
    ? `/etc/letsencrypt/live/${TlsDomain}`
    : `${__dirname}/../certs`;
function tlsCerts() {
    certsCache.tls ??= {
        key: Fs.readFileSync(`${tlsCertsPath}/privkey.pem`),
        cert: Fs.readFileSync(`${tlsCertsPath}/fullchain.pem`),
    };
    return certsCache.tls;
}
//# sourceMappingURL=Certs.js.map