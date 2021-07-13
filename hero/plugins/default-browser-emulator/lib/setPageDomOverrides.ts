import { BrowserEmulator } from "@secret-agent/plugin-utils";
import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import IBrowserData from '../interfaces/IBrowserData';
import loadDomOverrides from './loadDomOverrides';

export default async function setPageDomOverrides(emulator: BrowserEmulator, data: IBrowserData, page: IPuppetPage) {
  const domOverrides = loadDomOverrides(emulator, data);

  const scripts = domOverrides.build();
  const promises: Promise<any>[] = [];
  for (const script of scripts) {
    // overrides happen in main frame
    promises.push(page.addNewDocumentScript(script.script, false));
  }
  await Promise.all(promises);
}
