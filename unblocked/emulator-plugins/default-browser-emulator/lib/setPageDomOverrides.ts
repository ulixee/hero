import { IPage } from '@unblocked/emulator-spec/browser/IPage';
import IBrowserData from '../interfaces/IBrowserData';
import DomOverridesBuilder from './DomOverridesBuilder';

export default async function setPageDomOverrides(
  domOverrides: DomOverridesBuilder,
  data: IBrowserData,
  page: IPage,
): Promise<void> {
  const scripts = domOverrides.build();
  const promises: Promise<any>[] = [];
  for (const script of scripts) {
    // overrides happen in main frame
    promises.push(page.addNewDocumentScript(script.script, false));
  }
  await Promise.all(promises);
}
