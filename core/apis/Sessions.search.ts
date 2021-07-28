import * as Fs from 'fs';
import SessionDb from '../dbs/SessionDb';
import ICoreApi from '../interfaces/ICoreApi';
import { GlobalPool } from '../index';
import CommandFormatter from '../lib/CommandFormatter';

export default function sessionsSearchApi(args: ISessionsSearchArgs): ISessionsSearchResult {
  const dataLocation = args.dataLocation ?? GlobalPool.sessionsDir;
  const results = {
    dataLocation,
    sessions: [],
  };

  for (const dbName of Fs.readdirSync(dataLocation)) {
    if (!dbName.endsWith('.db') || dbName === 'network.db' || dbName === 'sessions.db') continue;

    try {
      const sessionDb = new SessionDb(dataLocation, dbName.replace('.db', ''), {
        fileMustExist: true,
        readonly: true,
      });

      let didMatchDevtools = false;
      let didMatchCommands = false;
      const commands = sessionDb.commands.all();

      if (args.commandArg) {
        didMatchCommands = commands.some(x => x.args?.includes(args.commandArg));
      }

      if (args.devtoolsKey) {
        for (const msg of sessionDb.devtoolsMessages.all()) {
          if (
            msg.params?.includes(args.devtoolsKey) ||
            msg.result?.includes(args.devtoolsKey) ||
            msg.error?.includes(args.devtoolsKey)
          ) {
            didMatchDevtools = true;
            break;
          }
        }
      }

      if (didMatchCommands || didMatchDevtools) {
        const session = sessionDb.session.get();
        const { id, name, startDate, closeDate } = session;

        results.sessions.push({
          id,
          name,
          start: new Date(startDate),
          end: new Date(closeDate),
          commands: commands.map(x => CommandFormatter.toString(x)),
          didMatchCommands,
          didMatchDevtools,
        });
      }
    } catch (err) {
      // just ignore if db couldn't be opened
    }
  }
  return results;
}

export interface ISessionsSearchApi extends ICoreApi {
  args: ISessionsSearchArgs;
  result: ISessionsSearchResult;
}

export interface ISessionsSearchArgs {
  dataLocation?: string;
  commandArg?: string;
  devtoolsKey?: string;
}
export interface ISessionsSearchResult {
  dataLocation: string;
  sessions: {
    id: string;
    name: string;
    start: Date;
    end: Date;
    commands: string[];
    didMatchDevtools: boolean;
    didMatchCommands: boolean;
  }[];
}
