import { IJsPath } from '@unblocked-web/js-path';

export default interface IFileChooserPrompt {
  frameId: number;
  selectMultiple: boolean;
  jsPath: IJsPath;
}
