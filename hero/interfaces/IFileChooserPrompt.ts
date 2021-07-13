import { IJsPath } from 'awaited-dom/base/AwaitedPath';

export default interface IFileChooserPrompt {
  frameId: number;
  selectMultiple: boolean;
  jsPath: IJsPath;
}
