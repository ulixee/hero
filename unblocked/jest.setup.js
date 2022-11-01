const fs = require('fs');

const rmSync = 'rmSync' in fs ? 'rmSync' : 'rmdirSync';

// eslint-disable-next-line import/no-extraneous-dependencies
const CertificateManager = require('@ulixee/unblocked-agent-mitm-socket/lib/CertificateGenerator').default;

const dataDir = process.env.UBK_DATA_DIR ?? `${__dirname}/.data-test`;

module.exports = async () => {
  try {
    fs[rmSync](dataDir, { recursive: true });
    fs.mkdirSync(dataDir);
  
    // generate base certs
    const certManager = new CertificateManager({
      storageDir: dataDir,
    });
    await certManager.waitForConnected;
    certManager.close();
  } catch (err) {
    // ignore
  }
};
