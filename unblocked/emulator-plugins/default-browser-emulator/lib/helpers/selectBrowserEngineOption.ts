import IBrowserEngineOption from '@unblocked/emulator-spec/browser/IBrowserEngineOption';
import { IDataBrowserEngineOptions } from '../../interfaces/IBrowserData';
import { defaultBrowserEngine } from '../../index';

export default function selectBrowserEngineOption(
  browserEngineId: string,
  browserEngineOptions: IDataBrowserEngineOptions,
): IBrowserEngineOption {
  const browserEngineOption = browserEngineOptions.find(x => x.id === browserEngineId);
  return browserEngineOption ?? browserEngineOptions.find(x => x.id === defaultBrowserEngine.id);
}
