import * as ChildProcess from 'child_process';
import * as Fs from 'fs';
import * as Http from 'http';
import * as Lockfile from 'proper-lockfile';
import { getBinaryPath, getInstallDirectory, isBinaryInstalled } from '~install/Utils';

const replayDir = getInstallDirectory();
const registrationApiFilepath = `${replayDir}/api.txt`;
const launchLockPath = `${replayDir}/launch`;

let registrationHost = '';
function resolveHost() {
  try {
    registrationHost = Fs.readFileSync(registrationApiFilepath, 'utf8');
  } catch (err) {
    // no-op
    registrationHost = '';
  }
  return registrationHost;
}

try {
  if (!Fs.existsSync(replayDir)) {
    Fs.mkdirSync(replayDir, { recursive: true });
  }
  if (!Fs.existsSync(registrationApiFilepath)) {
    Fs.writeFileSync(registrationApiFilepath, '');
  } else {
    resolveHost();
  }
} catch (err) {
  // couldn't listen for file
}

let apiStartPath: string;
try {
  apiStartPath = require.resolve('@secret-agent/core/start');
} catch (err) {
  // not installed locally (not full-client)
}

let hasLocalReplay = false;
try {
  require.resolve('./app');
  hasLocalReplay = !process.env.SA_USE_REPLAY_BINARY;
} catch (err) {
  // not installed locally
}

export async function replay(launchArgs: IReplayScriptRegistration): Promise<any> {
  const showLogs = !!process.env.SA_REPLAY_DEBUG;
  const {
    replayApiUrl,
    sessionsDataLocation,
    sessionName,
    scriptInstanceId,
    sessionId,
    scriptStartDate,
  } = launchArgs;

  const scriptMeta = {
    replayApiUrl,
    dataLocation: sessionsDataLocation,
    sessionName,
    sessionId,
    scriptStartDate,
    scriptInstanceId,
    apiStartPath,
    nodePath: process.execPath,
  };

  if (await registerScript(scriptMeta)) {
    return;
  }

  // cross-process lock around the launch process so we don't open multiple instances
  let release: () => Promise<void>;
  try {
    release = await Lockfile.lock(launchLockPath, {
      retries: 5,
      stale: 30e3,
      fs: Fs,
      realpath: false,
    });
    // make sure last "lock holder" didn't write the
    if (await registerScript(scriptMeta)) {
      return;
    }

    Fs.writeFileSync(registrationApiFilepath, '');

    if (hasLocalReplay) {
      const replayPath = require.resolve('@secret-agent/replay');
      await launchReplay('yarn electron', [replayPath, '--electron-launch'], true);
    } else if (isBinaryInstalled()) {
      await launchReplay(getBinaryPath(), ['--binary-launch']);
    }

    // wait for change
    await new Promise<void>(resolve => {
      const watcher = Fs.watch(
        registrationApiFilepath,
        { persistent: false, recursive: false },
        () => {
          if (resolveHost()) {
            resolve();
            watcher.close();
          }
        },
      );
    });

    if (!(await registerScript(scriptMeta))) {
      console.log("Couldn't register this script with the Replay app.", scriptMeta);
    }
  } catch (err) {
    if (showLogs) {
      console.log('Error launching Replay', scriptMeta, err);
    }
  } finally {
    if (release) await release();
  }
}

function launchReplay(appPath: string, args: string[], needsShell = false): void {
  const showLogs = !!process.env.SA_REPLAY_DEBUG;
  const child = ChildProcess.spawn(appPath, args, {
    detached: true,
    stdio: ['ignore', showLogs ? 'inherit' : 'ignore', showLogs ? 'inherit' : 'ignore'],
    shell: needsShell,
    windowsHide: false,
  });
  child.unref();
}

async function registerScript(data: any): Promise<boolean> {
  if (!resolveHost()) return false;

  try {
    const url = new URL(registrationHost);
    const request = Http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = new Promise<Http.IncomingMessage>((resolve, reject) => {
      request.on('error', reject);
      request.on('response', resolve);
    });
    request.end(JSON.stringify(data));
    if ((await response)?.statusCode === 200) {
      // registered successfully
      return true;
    }
  } catch (err) {
    // doesn't exist
  }
  Fs.writeFileSync(registrationApiFilepath, '');
  registrationHost = '';
  return false;
}

interface IReplayScriptRegistration {
  replayApiUrl: string;
  sessionsDataLocation: string;
  sessionName: string;
  sessionId: string;
  scriptStartDate: string;
  scriptInstanceId: string;
}
