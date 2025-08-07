import IFileChooserPrompt from '@ulixee/unblocked-specification/agent/browser/IFileChooserPrompt';
import { IHTMLInputElement } from '@ulixee/awaited-dom/base/interfaces/official';
import CoreFrameEnvironment from './CoreFrameEnvironment';
export default class FileChooser {
    #private;
    acceptsMultipleFiles: boolean;
    inputElement: IHTMLInputElement;
    constructor(coreFrame: Promise<CoreFrameEnvironment>, event: IFileChooserPrompt);
    chooseFiles(...files: {
        name: string;
        data: Buffer;
    }[]): Promise<void>;
}
