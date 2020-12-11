import Forge from 'node-forge';
import moment from 'moment';
import NetworkDb from './NetworkDb';
import pki = Forge.pki;

export default class CertificateAuthority {
  private certificate: pki.Certificate;
  private keyPair: pki.KeyPair;
  private db: NetworkDb;

  constructor(networkDb: NetworkDb) {
    this.db = networkDb;
    const baseCert = this.db.certificates.get('ca');
    if (baseCert) {
      this.certificate = pki.certificateFromPem(baseCert.pem);

      const keypair = this.db.pki.get('ca');
      this.keyPair = {
        privateKey: pki.privateKeyFromPem(keypair.privateKey),
        publicKey: pki.publicKeyFromPem(keypair.publicKey),
      };
    } else {
      this.generateCA();
    }
  }

  public getCertificateKeys(hostname: string): Promise<{ cert: string; key: string }> {
    const key = this.db.pki.get(hostname);
    if (key) {
      const cert = this.db.certificates.get(hostname);
      return Promise.resolve({ key: key.privateKey, cert: cert.pem });
    }

    const hosts = [hostname];
    return this.generateServerCertificateKeys(hosts);
  }

  private async generateServerCertificateKeys(
    hostParam: string | string[],
  ): Promise<{ cert: string; key: string }> {
    let hosts = hostParam;
    if (typeof hosts === 'string') hosts = [hosts];

    const [mainHost] = hosts;
    const keys = await new Promise<pki.rsa.KeyPair>((resolve, reject) => {
      pki.rsa.generateKeyPair({ bits: 2048 }, (err, keypair) => {
        if (err) return reject(err);
        resolve(keypair);
      });
    });
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = randomSerialNumber();
    cert.validity.notBefore = moment().subtract(1, 'day').toDate();
    cert.validity.notAfter = moment().add(2, 'years').toDate();

    cert.setSubject([
      {
        name: 'commonName',
        value: mainHost,
      },
      ...ServerAttrs,
    ]);
    cert.setIssuer(this.certificate.issuer.attributes);
    cert.setExtensions(getServerExtensions(hosts));
    cert.sign(this.keyPair.privateKey, Forge.md.sha256.create());

    const { certPem, privateKey } = this.recordPem(mainHost, cert, keys);
    return { cert: certPem, key: privateKey };
  }

  private generateCA(): void {
    const keys = pki.rsa.generateKeyPair(2048);

    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = randomSerialNumber();
    cert.validity.notBefore = moment().subtract(1, 'days').toDate();
    cert.validity.notAfter = moment().add(10, 'years').toDate();
    cert.setSubject(CaAttrs);
    cert.setIssuer(CaAttrs);
    cert.setExtensions(CaExtensions);
    cert.sign(keys.privateKey, Forge.md.sha256.create());
    this.certificate = cert;
    this.keyPair = keys;
    this.recordPem('ca', cert, keys);
  }

  private recordPem(
    host: string,
    cert: pki.Certificate,
    keyPair: pki.KeyPair,
  ): { certPem: string; privateKey: string; publicKey: string } {
    const certPem = pki.certificateToPem(cert);
    const privateKey = pki.privateKeyToPem(keyPair.privateKey);
    const publicKey = pki.publicKeyToPem(keyPair.publicKey);

    this.db.certificates.insert({
      host,
      pem: certPem,
      beginDate: cert.validity.notBefore,
      expireDate: cert.validity.notAfter,
    });
    this.db.pki.insert({
      host,
      privateKey,
      publicKey,
      beginDate: cert.validity.notBefore,
      expireDate: cert.validity.notAfter,
    });
    return { certPem, privateKey, publicKey };
  }
}

const CaAttrs = [
  {
    name: 'commonName',
    value: 'SecretAgentCA',
  },
  {
    name: 'countryName',
    value: 'Internet',
  },
  {
    shortName: 'ST',
    value: 'Internet',
  },
  {
    name: 'localityName',
    value: 'Internet',
  },
  {
    name: 'organizationName',
    value: 'Data Liberation Foundation',
  },
  {
    shortName: 'OU',
    value: 'GA',
  },
];

const CaExtensions = [
  {
    name: 'basicConstraints',
    cA: true,
  },
  {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true,
  },
  {
    name: 'nsCertType',
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true,
  },
  {
    name: 'subjectKeyIdentifier',
  },
];

const ServerAttrs = [
  {
    name: 'countryName',
    value: 'Internet',
  },
  {
    shortName: 'ST',
    value: 'Internet',
  },
  {
    name: 'localityName',
    value: 'Internet',
  },
  {
    name: 'organizationName',
    value: 'Data Liberation Foundation',
  },
  {
    shortName: 'OU',
    value: 'DLF Server Certificate',
  },
];

function getServerExtensions(hosts: string[]): any[] {
  return [
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      keyCertSign: false,
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false,
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: false,
      objsign: false,
      sslCA: false,
      emailCA: false,
      objCA: false,
    },
    {
      name: 'subjectKeyIdentifier',
    },
    {
      name: 'subjectAltName',
      altNames: hosts.map(host => {
        if (host.match(/^[\d.]+$/)) {
          return { type: 7, ip: host };
        }
        return { type: 2, value: host };
      }),
    },
  ];
}

function randomSerialNumber(): string {
  // generate random 16 bytes hex string
  let sn = '';
  for (let i = 0; i < 4; i += 1) {
    // eslint-disable-next-line no-restricted-properties
    const randomHex = Math.floor(Math.random() * Math.pow(256, 4)).toString(16);
    sn += `00000000${randomHex}`.slice(-8);
  }
  return sn;
}
