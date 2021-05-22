import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IExecJsPathResult from './IExecJsPathResult';

export default interface IJsPathResult {
  jsPath: IJsPath;
  result: IExecJsPathResult<any>;
  index: number;
}
