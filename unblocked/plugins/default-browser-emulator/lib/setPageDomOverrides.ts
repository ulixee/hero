import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IBrowserData from '../interfaces/IBrowserData';
import DomOverridesBuilder from './DomOverridesBuilder';

export default async function setPageDomOverrides(
  domOverrides: DomOverridesBuilder,
  data: IBrowserData,
  page: IPage,
): Promise<void> {
  const script = domOverrides.build('page');
  const promises: Promise<any>[] = [];
  for (const { name, fn } of script.callbacks) {
    promises.push(page.addPageCallback(name, fn, false));
  }
  // overrides happen in main frame
  promises.push(page.addNewDocumentScript(script.script, false));

  await Promise.all(promises);
}
