import ChildProcess from 'child_process';
import { getBinaryPath, isBinaryInstalled } from './Utils';

const apiPath = require.resolve('@secret-agent/replay-api/start');

const showLogs = !!process.env.SA_REPLAY_DEBUG;

export default function replay(args: IReplayLaunchArgs) {
  const { sessionsDataLocation, sessionName, id } = args;
  const argArray = [
    require.resolve('@secret-agent/replay-app'),
    sessionsDataLocation,
    sessionName,
    id,
    apiPath,
  ];

  let executable = 'node $(yarn bin electron)';
  let needsShell = true;

  if (isBinaryInstalled()) {
    needsShell = false;
    executable = getBinaryPath();
  }

  ChildProcess.spawn(executable, argArray, {
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
