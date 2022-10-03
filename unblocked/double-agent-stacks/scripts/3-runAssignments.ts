import '@ulixee/commons/lib/SourceMapSupport';
import { program } from 'commander';
import { exit } from 'process';
import { IRunnerFactory } from '@double-agent/runner/interfaces/IRunnerFactory';
import AssignmentRunner from '@double-agent/runner/lib/AssignmentRunner';
import UnblockedRunnerFactory from '../lib/UnblockedRunnerFactory';
import PuppeteerRunnerFactory from '../lib/PuppeteerRunnerFactory';
import { getExternalDataPath } from '../paths';

// RunnerId groups together all supported runner implementations.
enum RunnerId {
  Puppeteer = 'puppeteer',
  Unblocked = 'unblocked',
}

function parseRunnerID(value: string, previous: RunnerId): RunnerId {
  switch (value.toLowerCase().trim()) {
    case 'unblocked':
    case 'ubk': {
      return RunnerId.Unblocked;
    }

    case 'puppeteer':
    case 'pptr': {
      return RunnerId.Puppeteer;
    }

    default: {
      console.warn(`parseRunnerID: ignore unrecognized runner value: '${value}'`);
      return previous;
    }
  }
}

program.option(
  '-r, --runner <unblocked|ubk|pptr|puppeteer>',
  'select the runner to run',
  parseRunnerID,
  RunnerId.Unblocked,
);
program.parse();
const options = program.opts();

const userAgentsToTestPath = getExternalDataPath(`/2-user-agents-to-test/userAgentsToTest.json`);
const dataDir = getExternalDataPath(`/3-assignments`);

const runnerId = options.runner || RunnerId.Puppeteer;
let runnerFactory: IRunnerFactory;

switch (runnerId) {
  case RunnerId.Puppeteer: {
    runnerFactory = new PuppeteerRunnerFactory();
    break;
  }

  case RunnerId.Unblocked: {
    runnerFactory = new UnblockedRunnerFactory();
    break;
  }

  default:
    console.error(`ignoring runner with id ${runnerId}: unsupported`);
    exit(1);
}

new AssignmentRunner(runnerFactory, userAgentsToTestPath, dataDir)
  .run()
  .catch(console.log);
