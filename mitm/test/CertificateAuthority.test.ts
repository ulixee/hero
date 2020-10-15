import { Helpers } from "@secret-agent/testing";
import MitmProxy from "../lib/MitmProxy";

afterAll(Helpers.afterAll);

test('should generate a root CA file', async () => {
  const proxy = new MitmProxy({ port: 0 });
  Helpers.needsClosing.push(proxy);

  await proxy.listen();
  // @ts-ignore
  expect(proxy.ca.certificate).toBeTruthy();
  await proxy.close();
});
