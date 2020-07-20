import ChildProcess from 'child_process';

export default function(args: IReplayLaunchArgs) {
  const { sessionsDataLocation, sessionName, id, localApiStartPath } = args;
  return ChildProcess.spawn(
    'node $(yarn bin electron)',
    [__dirname, sessionsDataLocation, sessionName, id, localApiStartPath],
    {
      detached: true,
      stdio: 'ignore',
      shell: true,
    },
  ).unref();
}

interface IReplayLaunchArgs {
  localApiStartPath?: string;
  sessionsDataLocation: string;
  sessionName: string;
  id: string;
}
