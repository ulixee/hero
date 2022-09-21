import '@ulixee/commons/lib/SourceMapSupport';
import * as stableChromeVersions from '@unblocked-web/real-user-agents/data/stableChromeVersions.json';
import * as Fs from 'fs';
import * as Path from 'path';
import IBrowserEngineOption from '@unblocked-web/specifications/agent/browser/IBrowserEngineOption';
import { rootDir } from '../paths';

export default async function updateBrowserList(): Promise<IBrowserEngineOption[]> {
  // only take last 10 to profile
  const browserEngineOptions = stableChromeVersions.slice(0, 10).map((x) => {
    return { ...x, bypass: false };
  });
  await Fs.promises.writeFile(
    Path.resolve(rootDir, `browserEngineOptions.json`),
    JSON.stringify(browserEngineOptions, null, 2),
  );
  return browserEngineOptions;
}
