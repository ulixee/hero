import * as Path from 'path';
import { getCacheDirectory } from '@ulixee/commons/lib/dirUtils';
import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import IPageStateAssertionBatch from '@ulixee/hero-interfaces/IPageStateAssertionBatch';
import * as Fs from 'fs';
import PageStateGenerator from './PageStateGenerator';

const defaultCacheDir = Path.join(getCacheDirectory(), 'ulixee');

export default class PageStateCodeBlock {
  public static async loadAssertionBatch(batchId: string): Promise<IPageStateAssertionBatch> {
    if (!batchId.startsWith('@')) return;
    return await readFileAsJson(`${defaultCacheDir}/${batchId.substr(1)}`);
  }

  public static async generateCodeBlock(generator: PageStateGenerator): Promise<string> {
    let code = `tab.waitForPageState({`;

    const id = generator.id;
    await Fs.promises.mkdir(`${defaultCacheDir}/pagestate/${id}`, { recursive: true });
    for (const state of generator.statesByName.keys()) {
      const exported = generator.export(state);
      const savePath = Path.normalize(`${defaultCacheDir}/pagestate/${id}/${state}.json`);
      await Fs.promises.writeFile(savePath, JSON.stringify(exported));
      code += `\n  ${JSON.stringify(state)}: ({ loadFrom }) => loadFrom(${JSON.stringify(
        `@/pagestate/${id}/${state}.json`,
      )}),`;
    }

    code += `\n});`;

    return code;
  }
}
