import CommandTimeline from '@ulixee/hero-timetravel/lib/CommandTimeline';
import SessionDb from '../dbs/SessionDb';
import CommandFormatter from '../lib/CommandFormatter';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import ICoreApi from '../interfaces/ICoreApi';
import Session from '../lib/Session';

export default function sessionCommandsApi(args: ISessionCommandsArgs): ISessionCommandsResult {
  const timeline = loadCommandTimeline(args);

  const commandsWithResults = timeline.commands.map(CommandFormatter.parseResult);

  return {
    commands: commandsWithResults,
  };
}

export function loadCommandTimeline(args: ISessionCommandsArgs): CommandTimeline {
  Session.get(args.sessionId)?.db?.flush();
  const sessionDb = SessionDb.getCached(args.sessionId, true);

  return CommandTimeline.fromDb(sessionDb);
}

export interface ISessionCommandsApi extends ICoreApi {
  args: ISessionCommandsArgs;
  result: ISessionCommandsResult;
}

export interface ISessionCommandsArgs {
  sessionId: string;
}

export interface ISessionCommandsResult {
  commands: ICommandWithResult[];
}
