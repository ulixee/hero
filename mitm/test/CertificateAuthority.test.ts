import { promises as fs } from 'fs';
import MitmProxy from '../lib/MitmProxy';

test('should generate a root CA file', async () => {
  const proxy = await new MitmProxy();
  await proxy.listen({
    port: 0,
  });
  // @ts-ignore
  await fs.access(`${proxy.sslCaDir}/certs/ca.pem`);
  await proxy.close();
});
