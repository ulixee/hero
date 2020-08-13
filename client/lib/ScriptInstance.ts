import { v1 as uuidv1 } from 'uuid';
import IScriptInstanceMeta from '@secret-agent/core-interfaces/IScriptInstanceMeta';
import CoreClientSession from './CoreClientSession';

export default class ScriptInstance {
  public readonly id: string = uuidv1();
  public readonly entrypoint: string = process.argv[1];
  public readonly startDate: string = new Date().toISOString();
  private sessionNameCountByName: { [name: string]: number } = {};

  public get meta(): IScriptInstanceMeta {
    return {
      id: this.id,
      entrypoint: this.entrypoint,
      startDate: this.startDate,
    };
  }

  public launchReplay(sessionName: string, coreClientSession: CoreClientSession) {
    const launch = require('@secret-agent/replay').default;
    launch({
      scriptInstanceId: this.id,
      sessionName,
      sessionsDataLocation: coreClientSession.sessionsDataLocation,
      replayApiServer: coreClientSession.replayApiServer,
      sessionId: coreClientSession.sessionId,
    });
  }

  public generateSessionName(name: string, shouldCleanName: boolean = true) {
    if (name && shouldCleanName) {
      name = cleanupSessionName(name);
    }
    name = name || 'default-session';

    this.sessionNameCountByName[name] = this.sessionNameCountByName[name] || 0;
    const countPlusOne = this.sessionNameCountByName[name] + 1;
    if (countPlusOne > 1) {
      const newName = `${name}-${countPlusOne}`;
      if (this.sessionNameCountByName[newName]) {
        return this.generateSessionName(newName, false);
      }
      this.sessionNameCountByName[name] += 1;
      return newName;
    }
    this.sessionNameCountByName[name] += 1;
    return name;
  }
}

function cleanupSessionName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/--/g, '')
    .replace(/^-|-$/g, '');
}
