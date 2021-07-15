import { IDataBrowserEngineOptions } from '../../interfaces/IBrowserData';
import { latestBrowserEngineId } from '../../index';

export default function selectBrowserEngineOption(
  browserEngineId: string,
  browserEngineOptions: IDataBrowserEngineOptions,
) {
  const browserEngineOption = browserEngineOptions.find(x => x.id === browserEngineId);
  return browserEngineOption || browserEngineOptions.find(x => x.id === latestBrowserEngineId);
}
