import { IBoundLog } from './ILog';
import IBrowserEngine from './IBrowserEngine';
import IPlugins from "./IPlugins";

export default interface IPluginCreateOptions {
  browserEngine: IBrowserEngine;
  plugins: IPlugins;
  logger: IBoundLog;
}
