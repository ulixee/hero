import fs, { promises as FS } from 'fs';
import path from 'path';
import Forge from 'node-forge';
import pki = Forge.pki;
import Log from '@secret-agent/commons/Logger';

const { log } = Log(module);

export default class CertificateAuthority {
  private certificate: pki.Certificate;
  private keyPair: pki.KeyPair;
  private certsFolder: string;
  private keysFolder: string;
  private baseCAFolder: string;

  public generateServerCertificateKeys(hostParam: string | string[]) {
    let hosts = hostParam;
    if (typeof hosts === 'string') hosts = [hosts];

    const [mainHost] = hosts;
    const keysServer = pki.rsa.generateKeyPair(2048);
    const certServer = pki.createCertificate();
    certServer.publicKey = keysServer.publicKey;
    certServer.serialNumber = this.randomSerialNumber();
    certServer.validity.notBefore = new Date();
    certServer.validity.notBefore.setDate(certServer.validity.notBefore.getDate() - 1);
    certServer.validity.notAfter = new Date();
    certServer.validity.notAfter.setFullYear(certServer.validity.notBefore.getFullYear() + 2);
    const attrsServer = ServerAttrs.slice(0);
    attrsServer.unshift({
      name: 'commonName',
      value: mainHost,
    });
    certServer.setSubject(attrsServer);
    certServer.setIssuer(this.certificate.issuer.attributes);
    certServer.setExtensions(
      ServerExtensions.concat([
        {
          name: 'subjectAltName',
          altNames: hosts.map(host => {
            if (host.match(/^[\d.]+$/)) {
              return { type: 7, ip: host };
            }
            return { type: 2, value: host };
          }),
        },
      ]),
    );
    certServer.sign(this.keyPair.privateKey, Forge.md.sha256.create());
    const certPem = pki.certificateToPem(certServer);
    const keyPrivatePem = pki.privateKeyToPem(keysServer.privateKey);
    const keyPublicPem = pki.publicKeyToPem(keysServer.publicKey);

    const hostFilename = mainHost.replace(/\*/g, '_');

    Promise.all([
      FS.writeFile(`${this.certsFolder}/${hostFilename}.pem`, certPem),
      FS.writeFile(`${this.keysFolder}/${hostFilename}.key`, keyPrivatePem),
      FS.writeFile(`${this.keysFolder}/${hostFilename}.public.key`, keyPublicPem),
    ]).catch(error => {
      log.error('CertificateSaveError', { error, sessionId: null });
    });
    // returns synchronously even before files get written to disk
    return { cert: certPem, key: keyPrivatePem };
  }

  public async getCertificateKeys(hostname: string) {
    const keyFilePath = `${this.keysFolder}/${hostname}.key`;
    const certFilePath = `${this.certsFolder}/${hostname}.pem`;
    if (fs.existsSync(keyFilePath)) {
      const certPromises = [FS.readFile(keyFilePath), FS.readFile(certFilePath)];
      return Promise.all(certPromises);
    }

    const hosts = [hostname];
    const certs = await this.generateServerCertificateKeys(hosts);
    return [certs.key, certs.cert];
  }

  private randomSerialNumber() {
    // generate random 16 bytes hex string
    let sn = '';
    for (let i = 0; i < 4; i += 1) {
      const randomHex = Math.floor(Math.random() * Math.pow(256, 4)).toString(16);
      sn += `00000000${randomHex}`.slice(-8);
    }
    return sn;
  }

  private async generateCA() {
    const keys = await new Promise<pki.KeyPair>((resolve, reject) => {
      pki.rsa.generateKeyPair({ bits: 2048 }, (err, k) => {
        if (err) {
          return reject(err);
        }
        resolve(k);
      });
    });

    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = this.randomSerialNumber();
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
    cert.setSubject(CAattrs);
    cert.setIssuer(CAattrs);
    cert.setExtensions(CAextensions);
    cert.sign(keys.privateKey, Forge.md.sha256.create());
    this.certificate = cert;
    this.keyPair = keys;

    await Promise.all([
      FS.writeFile(path.join(this.certsFolder, 'ca.pem'), pki.certificateToPem(cert)),
      FS.writeFile(
        path.join(this.keysFolder, 'ca.private.key'),
        pki.privateKeyToPem(keys.privateKey),
      ),
      FS.writeFile(path.join(this.keysFolder, 'ca.public.key'), pki.publicKeyToPem(keys.publicKey)),
    ]);
  }

  private async loadCA() {
    const certPEM = FS.readFile(path.join(this.certsFolder, 'ca.pem'), 'utf-8');
    const keyPrivatePEM = FS.readFile(path.join(this.keysFolder, 'ca.private.key'), 'utf-8');
    const keyPublicPEM = FS.readFile(path.join(this.keysFolder, 'ca.public.key'), 'utf-8');

    this.certificate = pki.certificateFromPem(await certPEM);
    this.keyPair = {
      privateKey: pki.privateKeyFromPem(await keyPrivatePEM),
      publicKey: pki.publicKeyFromPem(await keyPublicPEM),
    };
  }

  public static async create(caFolder: string) {
    const ca = new CertificateAuthority();
    ca.baseCAFolder = caFolder;
    ca.certsFolder = path.join(ca.baseCAFolder, 'certs');
    ca.keysFolder = path.join(ca.baseCAFolder, 'keys');

    await FS.mkdir(ca.baseCAFolder, { recursive: true });
    await FS.mkdir(ca.certsFolder, { recursive: true });
    await FS.mkdir(ca.keysFolder, { recursive: true });

    try {
      const stats = await FS.lstat(path.join(ca.certsFolder, 'ca.pem'));
      if (stats.isFile()) {
        await ca.loadCA();
      }
    } catch (err) {
      await ca.generateCA();
    }
    return ca;
  }
}

// tslint:disable-next-line:variable-name
const CAattrs = [
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

// tslint:disable-next-line:variable-name
const CAextensions = [
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

// tslint:disable-next-line:variable-name
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

// tslint:disable-next-line:variable-name
const ServerExtensions: any[] = [
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
];
