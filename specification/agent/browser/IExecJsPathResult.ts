import { INodePointer, IJsPathError } from '@ulixee/js-path';

export default interface IExecJsPathResult<T = any> {
  value: T;
  isValueSerialized?: boolean;
  pathError?: IJsPathError;
  nodePointer?: INodePointer;
}
