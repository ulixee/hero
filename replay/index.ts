import * as ChildProcess from 'child_process';
import * as Fs from 'fs';
import * as Http from 'http';
import * as Lockfile from 'proper-lockfile';
import { getBinaryPath, getInstallDirectory, isBinaryInstalled } from './install/Utils';

const showLogs = !!process.env.SA_REPLAY_DEBUG;
const replayDir = getInstallDirectory();
const replayRegistrationApiPath = `${replayDir}/api.txt`;
const launchLockPath = `${replayDir}/launch`;

if (!Fs.existsSync(replayDir)) Fs.mkdirSync(replayDir, { recursive: true });

let sessionApiPath: string;
try {
  sessionApiPath = require.resolve('@secret-agent/session-state/api/start');
} catch (err) {
  // not installed locally (not full-client)
}

let replayRegistrationHost: string;

export async function replay(launchArgs: IReplayScriptRegistration): Promise<any> {
  const {
    replayApiServer,
    sessionsDataLocation,
    sessionName,
    scriptInstanceId,
    sessionId,
    scriptStartDate,
  } = launchArgs;

  const scriptMeta = {
    sessionStateApi: replayApiServer,
    dataLocation: sessionsDataLocation,
    sessionName,
    sessionId,
    scriptStartDate,
    scriptInstanceId,
    apiStartPath: sessionApiPath,
    nodePath: process.execPath,
  };

  if (await registerScript(scriptMeta)) {
    return;
  }

  // cross-process lock around the launch process so we don't open multiple instances
  const release = await Lockfile.lock(launchLockPath, {
    retries: 5,
    stale: 30e3,
    fs: Fs,
    realpath: false,
  });
  try {
    // make sure last "lock holder" didn't write the
    if (await registerScript(scriptMeta)) {
      return;
    }

    if (Fs.existsSync(replayRegistrationApiPath)) Fs.unlinkSync(replayRegistrationApiPath);
    if (isBinaryInstalled()) {
      await launchReplay(getBinaryPath(), ['--binary-launch']);
    } else {
      try {
        const replayPath = require.resolve('@secret-agent/replay');
        await launchReplay('yarn electron', [replayPath, '--electron-launch'], true);
      } catch (error) {
        if (showLogs) {
          console.log('Replay app not found', error);
        }
      }
    }

    if (!(await registerScript(scriptMeta))) {
      console.log("Couldn't register this script with the Replay app.");
    }
  } finally {
    await release();
  }
}

async function launchReplay(appPath: string, args: string[], needsShell = false): Promise<void> {
  const child = ChildProcess.spawn(appPath, args, {
    detached: true,
    stdio: ['ignore', showLogs ? 'inherit' : 'ignore', 'pipe'],
    shell: needsShell,
    windowsHide: false,
  });
  child.unref();
  child.stderr.setEncoding('utf8');

  await new Promise<void>(resolve => {
    child.stderr.on('data', message => {
      const matches = message.match(/.*REPLAY REGISTRATION API \[(.+)\]/);
      if (matches?.length) {
        Fs.writeFileSync(replayRegistrationApiPath, matches[1]);
        child.stderr.removeAllListeners('data');
        resolve();
      }
    });
  });
}

function didLoadReplayRegistrationHost(): boolean {
  if (replayRegistrationHost) return true;
  if (!Fs.existsSync(replayRegistrationApiPath)) return false;
  try {
    replayRegistrationHost = Fs.readFileSync(replayRegistrationApiPath, 'utf8').trim();
    return true;
  } catch (err) {
    return false;
  }
}

async function registerScript(data: any): Promise<boolean> {
  if (!didLoadReplayRegistrationHost()) return false;

  try {
    const url = new URL(replayRegistrationHost);
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
  replayRegistrationHost = null;
  return false;
}

interface IReplayScriptRegistration {
  replayApiServer: string;
  sessionsDataLocation: string;
  sessionName: string;
  sessionId: string;
  scriptStartDate: string;
  scriptInstanceId: string;
}
