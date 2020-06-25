import uuid from 'uuid/v1';
import ChildProcess from 'child_process';
import IScriptInstanceMeta from '@secret-agent/core-interfaces/IScriptInstanceMeta';

export default class ScriptInstance {
  public readonly id: string = uuid();
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

  public launchReplay(sessionName: string, sessionsDataLocation: string) {
    if (process.env.SA_SHOW_REPLAY !== 'true') return;
    const electronPath = require.resolve('electron/cli.js');
    const replayPath = require.resolve('@secret-agent/replay');
    const args = [replayPath, sessionsDataLocation, sessionName, this.id, this.entrypoint];
    const child = ChildProcess.spawn(electronPath, args, { detached: true, stdio: 'ignore' });
    child.unref();
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
