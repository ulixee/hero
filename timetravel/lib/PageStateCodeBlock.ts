import * as Path from 'path';
import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import IPageStateAssertionBatch from '@ulixee/hero-interfaces/IPageStateAssertionBatch';
import * as Fs from 'fs';
import PageStateGenerator from './PageStateGenerator';
import UlixeeConfig, { IRuntimeLocation } from '@ulixee/commons/config';
import { execSync } from 'child_process';

export default class PageStateCodeBlock {
  public static async loadAssertionBatch(
    batchId: string,
    runtimeLocation: IRuntimeLocation,
  ): Promise<IPageStateAssertionBatch> {
    if (!batchId.startsWith('@')) return;
    const dir = UlixeeConfig.findConfigDirectory(runtimeLocation);
    return await readFileAsJson(Path.join(dir, 'pagestate', batchId.substr(1)));
  }

  public static async generateCodeBlock(
    generator: PageStateGenerator,
    runtimeLocation: IRuntimeLocation,
  ): Promise<string> {
    let code = `{`;

    const dir = UlixeeConfig.findConfigDirectory(runtimeLocation);
    await Fs.promises.mkdir(`${dir}/pagestate`, { recursive: true });
    for (const state of generator.statesByName.keys()) {
      const exported = generator.export(state);
      const savePath = Path.normalize(`${dir}/pagestate/${exported.id}.json`);
      await Fs.promises.writeFile(savePath, JSON.stringify(exported, null, 2));
      try {
        execSync(`prettier --write ${savePath}`, {
          cwd: runtimeLocation.workingDirectory,
        });
      } catch (err) {
        console.warn(
          'Could not run prettier on Hero PageState configurations. We recommend installing prettier in your project or globally to reduce merge conflicts.',
        );
      }
      const stateKey = JSON.stringify(state);

      code += `\n  ${stateKey}: ({ loadFrom }) => loadFrom(${JSON.stringify(
        `@/${exported.id}.json`,
      )}),`;
    }

    code += `\n}`;

    return code;
  }
}
