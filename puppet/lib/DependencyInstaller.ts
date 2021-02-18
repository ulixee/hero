import { promises as Fs } from 'fs';

import IBrowserEngine from '@secret-agent/core-interfaces/IBrowserEngine';
import * as path from 'path';
import { EngineFetcher } from './EngineFetcher';

export default class DependencyInstaller {
  public static aptScriptPath = `${EngineFetcher.cacheDirectoryByPlatform.linux}/secret-agent/chrome/apt.sh`;

  static async appendAptInstallNeeded(engine: IBrowserEngine): Promise<void> {
    const aptScriptPath = DependencyInstaller.aptScriptPath;

    const existing = await this.getAptScript();
    const installPath = path.dirname(engine.executablePath);
    if (!existing.includes(installPath)) {
      await Fs.appendFile(
        aptScriptPath,
        `
if [ ! -f "${installPath}/.validated" ]; then
  chown _apt ${installPath}/install-dependencies.deb;
  apt-get update;
  apt install -y ${installPath}/install-dependencies.deb;
  apt-get -y autoremove;
  touch ${installPath}/.validated;
  chmod 777 ${installPath}/.validated;
fi
`,
      );
    }
  }

  static isValidated(engine: IBrowserEngine): Promise<boolean> {
    const validatedPath = this.getValidatedPath(engine);
    return Fs.access(validatedPath)
      .then(() => true)
      .catch(() => false);
  }

  static async markValidated(engine: IBrowserEngine): Promise<void> {
    const validatedPath = this.getValidatedPath(engine);
    await Fs.writeFile(validatedPath, '');
  }

  private static getValidatedPath(engine: IBrowserEngine): string {
    const installPath = path.dirname(engine.executablePath);
    return `${installPath}/.validated`;
  }

  private static async getAptScript(): Promise<string> {
    const aptScriptPath = DependencyInstaller.aptScriptPath;
    const scriptExists = await Fs.access(aptScriptPath).catch(() => false);
    if (scriptExists === false) {
      await Fs.writeFile(
        aptScriptPath,
        `#!/bin/bash

if [ "$(whoami)" != "root" ]; then
  read -p "This script helps install Chrome dependencies using APT installers. You'll be prompted for sudo access, so please look at the contents. (enter to continue)";
  su root;
fi

`,
      );
      await Fs.chmod(aptScriptPath, 0o755);
    }
    return await Fs.readFile(aptScriptPath, 'utf8');
  }
}
