import CommandTimeline from '@ulixee/hero-timetravel/lib/CommandTimeline';
import SessionDb from '../dbs/SessionDb';
import CommandFormatter from '../lib/CommandFormatter';
import ICommandWithResult from '../interfaces/ICommandWithResult';
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

interface ISessionCommandsArgs {
  sessionId: string;
}

interface ISessionCommandsResult {
  commands: ICommandWithResult[];
}
