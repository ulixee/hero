import { nanoid } from 'nanoid';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';

export default class ScriptInstance {
  public readonly id: string = nanoid();
  public readonly entrypoint = require.main?.filename ?? process.argv[1];
  public readonly startDate = Date.now();
  private sessionNameCountByName: { [name: string]: number } = {};

  public get meta(): IScriptInstanceMeta {
    return {
      id: this.id,
      workingDirectory: process.cwd(),
      entrypoint: this.entrypoint,
      startDate: this.startDate,
    };
  }

  public generateSessionName(name: string, shouldCleanName = true): string {
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

function cleanupSessionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/--/g, '')
    .replace(/^-|-$/g, '');
}
