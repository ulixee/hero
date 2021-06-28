import { promises as Fs } from 'fs';

import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import * as path from 'path';
import { EngineFetcher } from './EngineFetcher';

export default class DependencyInstaller {
  public static aptScriptPath = `${EngineFetcher.cacheDirectoryByPlatform.linux}/secret-agent/chrome/apt.sh`;

  static async appendAptInstallNeeded(browserEngine: IBrowserEngine): Promise<void> {
    const aptScriptPath = DependencyInstaller.aptScriptPath;

    const existing = await this.getAptScript();
    const installPath = path.dirname(browserEngine.executablePath);
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

  static isValidated(browserEngine: IBrowserEngine): Promise<boolean> {
    const validatedPath = this.getValidatedPath(browserEngine);
    return Fs.access(validatedPath)
      .then(() => true)
      .catch(() => false);
  }

  static async markValidated(browserEngine: IBrowserEngine): Promise<void> {
    const validatedPath = this.getValidatedPath(browserEngine);
    await Fs.writeFile(validatedPath, '');
  }

  private static getValidatedPath(browserEngine: IBrowserEngine): string {
    const installPath = path.dirname(browserEngine.executablePath);
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
