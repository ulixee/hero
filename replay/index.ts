import * as ChildProcess from 'child_process';
import { getBinaryPath, isBinaryInstalled } from './install/Utils';

const apiPath = require.resolve('@secret-agent/session-state/api/start');
const showLogs = !!process.env.SA_REPLAY_DEBUG;

export function replay(launchArgs: IReplayLaunchArgs) {
  const {
    replayApiServer,
    sessionsDataLocation,
    sessionName,
    scriptInstanceId,
    sessionId,
    scriptStartDate,
  } = launchArgs;

  const spawnArgs = [
    '',
    `--replay-data-location="${sessionsDataLocation}"`,
    `--replay-session-name="${sessionName}"`,
    `--replay-script-instance-id="${scriptInstanceId}"`,
    `--replay-session-id="${sessionId}"`,
    `--replay-api-path="${apiPath}"`,
    `--replay-node-path="${process.execPath}"`,
    `--replay-script-start-date="${scriptStartDate}"`,
    `--replay-api-server="${replayApiServer}"`,
    `--replay-node-path="${process.execPath}"`,
  ];

  if (isBinaryInstalled()) {
    return spawn(getBinaryPath(), spawnArgs);
  }

  try {
    // see if we can launch from monorepo
    spawnArgs[0] = require.resolve('@secret-agent/replay');

    spawn('yarn electron', spawnArgs, true);
  } catch (err) {
    if (showLogs) {
      console.log('Replay app not found');
    }
  }
}

function spawn(appPath: string, args: string[], needsShell = false) {
  ChildProcess.spawn(appPath, args, {
    detached: true,
    stdio: showLogs ? 'inherit' : 'ignore',
    shell: needsShell,
    windowsHide: false,
  }).unref();
}

interface IReplayLaunchArgs {
  replayApiServer: string;
  sessionsDataLocation: string;
  sessionName: string;
  sessionId: string;
  scriptStartDate: string;
  scriptInstanceId: string;
}
