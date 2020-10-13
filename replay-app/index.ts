import ChildProcess from 'child_process';
import Log from '@secret-agent/commons/Logger';
import { getBinaryPath, isBinaryInstalled } from './lib/Utils';

const { log } = Log(module);

const apiPath = require.resolve('@secret-agent/session-state/api/start');

export default function replay(launchArgs: IReplayLaunchArgs) {
  const {
    replayApiServer,
    sessionsDataLocation,
    sessionName,
    scriptInstanceId,
    sessionId,
  } = launchArgs;

  const spawnArgs = [
    '',
    `--replay-data-location="${sessionsDataLocation}"`,
    `--replay-session-name="${sessionName}"`,
    `--replay-script-instance-id="${scriptInstanceId}"`,
    `--replay-session-id="${sessionId}"`,
    `--replay-api-path="${apiPath}"`,
    `--replay-api-server="${replayApiServer}"`,
  ];

  if (isBinaryInstalled()) {
    return spawn(getBinaryPath(), spawnArgs);
  }

  try {
    // see if we can launch from monorepo
    spawnArgs[0] = require.resolve('@secret-agent/replay-app');

    spawn('yarn electron', spawnArgs, true);
  } catch (err) {
    log.info('Replay app not found');
  }
}

function spawn(appPath: string, args: string[], needsShell = false) {
  const showLogs = !!process.env.SA_REPLAY_DEBUG;

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
  scriptInstanceId: string;
}
