import * as Fs from 'fs';
import Config from '@double-agent/config';

const { MainDomain, CrossDomain, SubDomain, TlsDomain } = Config.collect.domains;

const certPath = Config.collect.enableLetsEncrypt
  ? `/etc/letsencrypt/live/${MainDomain}`
  : `${__dirname}/../certs`;

export const CertsMessage = `
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

const certsCache: {
  default?: ICert;
  tls?: ICert;
} = {};

export function checkSetup(): void {
  if (!Fs.existsSync(`${certPath}/privkey.pem`)) {
    throw new Error(
      `You haven't completed setup. You'll need SSL Certificates to run the servers!!\n\n${CertsMessage}`,
    );
  }
}

export default function certs(): ICert {
  checkSetup();
  certsCache.default ??= {
    key: Fs.readFileSync(`${certPath}/privkey.pem`),
    cert: Fs.readFileSync(`${certPath}/fullchain.pem`),
  };

  return certsCache.default;
}

const tlsCertsPath = Config.collect.enableLetsEncrypt
  ? `/etc/letsencrypt/live/${TlsDomain}`
  : `${__dirname}/../certs`;
export function tlsCerts(): ICert {
  certsCache.tls ??= {
    key: Fs.readFileSync(`${tlsCertsPath}/privkey.pem`),
    cert: Fs.readFileSync(`${tlsCertsPath}/fullchain.pem`),
  };
  return certsCache.tls;
}

interface ICert {
  key: Buffer;
  cert: Buffer;
}
