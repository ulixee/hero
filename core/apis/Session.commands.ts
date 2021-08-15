import SessionDb from '../dbs/SessionDb';
import CommandFormatter from '../lib/CommandFormatter';
import ICommandWithResult from '../interfaces/ICommandWithResult';
import ICoreApi from '../interfaces/ICoreApi';

export default function sessionCommandsApi(args: ISessionCommandsArgs): ISessionCommandsResult {
  const sessionDb = SessionDb.getCached(args.sessionId, true);

  // sort in case they got out of order (like saving in batch)
  const commands = sessionDb.commands.all().sort((a, b) => a.id - b.id);
  const commandsWithResults = commands.map(CommandFormatter.parseResult);

  return {
    commands: commandsWithResults,
  };
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
