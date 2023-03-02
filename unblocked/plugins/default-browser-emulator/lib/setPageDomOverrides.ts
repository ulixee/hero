import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IDevtoolsSession from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import IBrowserData from '../interfaces/IBrowserData';
import DomOverridesBuilder from './DomOverridesBuilder';

export default async function setPageDomOverrides(
  domOverrides: DomOverridesBuilder,
  data: IBrowserData,
  pageOrFrame: IPage,
  devtoolsSession?: IDevtoolsSession,
): Promise<void> {
  const script = domOverrides.build('page');
  const promises: Promise<any>[] = [];
  for (const { name, fn } of script.callbacks) {
    promises.push(pageOrFrame.addPageCallback(name, fn, false, devtoolsSession));
  }
  // overrides happen in main frame
  promises.push(pageOrFrame.addNewDocumentScript(script.script, false));

  await Promise.all(promises);
}
