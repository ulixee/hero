import { promises as fs } from 'fs';
import MitmProxy from '../lib/MitmProxy';

test('should generate a root CA file', async () => {
  const proxy = new MitmProxy({ port: 0 });
  await proxy.listen();
  // @ts-ignore
  await fs.access(`${proxy.sslCaDir}/certs/ca.pem`);
  await proxy.close();
});
