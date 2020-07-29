import ChildProcess from 'child_process';
import { getBinaryPath, isBinaryInstalled } from './Utils';
import Log from '@secret-agent/commons/Logger';

const { log } = Log(module);

const apiPath = require.resolve('@secret-agent/replay-api/start');

export default function replay(launchArgs: IReplayLaunchArgs) {
  const { sessionsDataLocation, sessionName, id } = launchArgs;
  const spawnArgs = ['', sessionsDataLocation, sessionName, id, apiPath];

  if (isBinaryInstalled()) {
    return spawn(getBinaryPath(), spawnArgs);
  }

  try {
    // see if we can launch from monorepo
    spawnArgs[0] = require.resolve('@secret-agent/replay-app');

    spawn('yarn electron', spawnArgs, true);
  } catch (err) {
    log.info('Replay app not found');
    return;
  }
}

function spawn(appPath: string, args: string[], needsShell: boolean = false) {
  const showLogs = !!process.env.SA_REPLAY_DEBUG;

  ChildProcess.spawn(appPath, args, {
    detached: true,
    stdio: showLogs ? 'inherit' : 'ignore',
    shell: needsShell,
    windowsHide: false,
  }).unref();
}

interface IReplayLaunchArgs {
  localApiStartPath?: string;
  sessionsDataLocation: string;
  sessionName: string;
  id: string;
}
