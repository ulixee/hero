import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import * as Fs from 'fs';
import SessionDb from '../dbs/SessionDb';
import ICoreApi from '../interfaces/ICoreApi';
import CommandFormatter from '../lib/CommandFormatter';

export default function sessionsFindWithErrorsApi(): ISessionsFindWithErrorsResult {
  const results = {
    sessions: [],
  };

  for (const dbName of Fs.readdirSync(SessionDb.databaseDir)) {
    if (!dbName.endsWith('.db')) continue;

    try {
      const sessionDb = new SessionDb(dbName.replace('.db', ''), {
        fileMustExist: true,
        readonly: true,
      });

      const session = sessionDb.session.get();

      const { id, name, startDate, closeDate } = session;

      const result: ISessionsFindWithErrorsResult['sessions'][0] = {
        id,
        name,
        start: new Date(startDate),
        end: new Date(closeDate),
        commandsWithErrors: [],
        logErrors: [],
      };

      const commands = sessionDb.commands.all();

      let i = 0;
      for (const command of commands) {
        const { resultType } = command;
        const isLastCommand = i === commands.length - 1;
        if (resultType === 'TimeoutError') {
          result.commandsWithErrors.push({
            label: CommandFormatter.toString(command),
            date: new Date(command.endDate),
            didTimeout: true,
            wasCanceled: false,
            isLastCommand,
          });
        } else if (resultType === 'CanceledPromiseError') {
          result.commandsWithErrors.push({
            label: CommandFormatter.toString(command),
            date: new Date(command.endDate),
            didTimeout: false,
            wasCanceled: true,
            isLastCommand,
          });
        }
        i += 1;
      }

      result.logErrors = sessionDb.sessionLogs.allErrors().map(x => {
        const error = TypeSerializer.parse(x.data);
        return {
          date: new Date(x.timestamp),
          action: x.action,
          path: x.module,
          error: error.clientError ?? error.error ?? error,
        };
      });

      if (result.logErrors.length || result.commandsWithErrors.length) {
        results.sessions.push(result);
      }
    } catch (err) {
      // just ignore if db couldn't be opened
    }
  }
  return results;
}

export interface ISessionsFindWithErrorsApi extends ICoreApi {
  result: ISessionsFindWithErrorsResult;
}

export interface ISessionsFindWithErrorsResult {
  sessions: {
    id: string;
    name: string;
    start: Date;
    end: Date;
    logErrors: { date: Date; action: string; path: string; error: string }[];
    commandsWithErrors: {
      wasCanceled: boolean;
      didTimeout: boolean;
      isLastCommand: boolean;
      label: string;
      date: Date;
    }[];
  }[];
}
