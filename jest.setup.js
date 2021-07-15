const fs = require('fs');

// eslint-disable-next-line import/no-extraneous-dependencies
const CertificateManager = require('@ulixee/hero-mitm-socket/lib/CertificateGenerator').default;

module.exports = async () => {
  try {
    fs.rmdirSync(`${__dirname}/.sessions-test`, { recursive: true });
    fs.mkdirSync(`${__dirname}/.sessions-test`);
    // generate certs
    const certManager = new CertificateManager({
      storageDir: `${__dirname}/.sessions-test`,
    });
    await certManager.waitForConnected;
    certManager.close();
  } catch (err) {
    // ignore
  }
};
