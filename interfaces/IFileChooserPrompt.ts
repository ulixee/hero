import { IJsPath } from 'awaited-dom/base/AwaitedPath';

export default interface IFileChooserPrompt {
  frameId: string;
  selectMultiple: boolean;
  jsPath: IJsPath;
}
