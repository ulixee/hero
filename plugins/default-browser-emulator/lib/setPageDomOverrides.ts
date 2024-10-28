import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IDevtoolsSession from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import IBrowserData from '../interfaces/IBrowserData';
import DomOverridesBuilder from './DomOverridesBuilder';
import INewDocumentInjectedScript from '../interfaces/INewDocumentInjectedScript';

export default async function setPageDomOverrides(
  domOverrides: DomOverridesBuilder,
  data: IBrowserData,
  pageOrFrame: IPage,
  devtoolsSession?: IDevtoolsSession,
): Promise<void> {
  const script = domOverrides.build('page');
  const callbacks: { [name: string]: INewDocumentInjectedScript['callback']['fn'] } = {};
  for (const { name, fn } of script.callbacks) {
    callbacks[name] = fn;
  }

  // overrides happen in main frame
  await pageOrFrame.addNewDocumentScript(script.script, false, callbacks, devtoolsSession);
}
