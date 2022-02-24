import IBrowserEngineOption from '@ulixee/hero-interfaces/IBrowserEngineOption';
import { IDataBrowserEngineOptions } from '../../interfaces/IBrowserData';
import { defaultBrowserEngine } from '../../index';

export default function selectBrowserEngineOption(
  browserEngineId: string,
  browserEngineOptions: IDataBrowserEngineOptions,
): IBrowserEngineOption {
  const browserEngineOption = browserEngineOptions.find(x => x.id === browserEngineId);
  return browserEngineOption ?? browserEngineOptions.find(x => x.id === defaultBrowserEngine.id);
}
