import '@ulixee/commons/lib/SourceMapSupport';
import '@double-agent/config/load';
import Collect from '@double-agent/collect';
import { checkSetup } from '@double-agent/collect/servers/Certs';
import Config from '@double-agent/config';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import Server from './lib/Server';

const serverPort = Config.collect.port;

(async function run() {
  checkSetup();
  // this server loads all the modules in the "detections" directory and runs a bot detector
  const collect = new Collect();

  // this server simply provides assignments for a scraper to follow to "test" their stack
  const server = new Server(collect, serverPort);
  ShutdownHandler.register(() => server.close());
  await server.start();

  if (Config.collect.shouldGenerateProfiles) {
    return;
  }

  console.log(''.padEnd(100, '-'));
  console.log(
    `
Run the suite:
4. Point your scraper at http://localhost:${serverPort} to get your first assignment.
5. Follow the assignment, and then ask this same url for your next assignment. Assignments will be returned until the test suite is completed.
    `,
  );
})().catch(console.error);
