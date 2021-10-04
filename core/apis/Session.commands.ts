import CommandTimeline from '@ulixee/hero-timetravel/lib/CommandTimeline';
import SessionDb from '../dbs/SessionDb';
import CommandFormatter from '../lib/CommandFormatter';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import ICoreApi from '../interfaces/ICoreApi';
import FrameNavigationsTable from '../models/FrameNavigationsTable';
import Session from '../lib/Session';

export default function sessionCommandsApi(args: ISessionCommandsArgs): ISessionCommandsResult {
  const timeline = loadCommandTimeline(args);

  const commandsWithResults = timeline.commands.map(CommandFormatter.parseResult);

  return {
    commands: commandsWithResults,
  };
}

export function loadCommandTimeline(args: ISessionCommandsArgs): CommandTimeline {
  Session.get(args.sessionId)?.sessionState?.db?.flush();
  const sessionDb = SessionDb.getCached(args.sessionId, true);

  // sort in case they got out of order (like saving in batch)
  const commands = sessionDb.commands.all().sort((a, b) => {
    if (a.run === b.run) return a.id - b.id;
    return a.run - b.run;
  });

  return new CommandTimeline(
    commands,
    commands[commands.length - 1].run,
    sessionDb.frameNavigations.all().map(x => FrameNavigationsTable.toNavigation(x)),
  );
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
