import IFileChooserPrompt from '@ulixee/unblocked-specification/agent/browser/IFileChooserPrompt';
import { IJsPath } from '@ulixee/js-path';
import AwaitedPath from '@ulixee/awaited-dom/base/AwaitedPath';
import { createHTMLInputElement } from '@ulixee/awaited-dom/impl/create';
import { IHTMLInputElement } from '@ulixee/awaited-dom/base/interfaces/official';
import CoreFrameEnvironment from './CoreFrameEnvironment';

export default class FileChooser {
  public acceptsMultipleFiles: boolean;
  public inputElement: IHTMLInputElement;

  readonly #jsPath: IJsPath;
  readonly #coreFrame: Promise<CoreFrameEnvironment>;

  constructor(coreFrame: Promise<CoreFrameEnvironment>, event: IFileChooserPrompt) {
    const awaitedPath = new AwaitedPath(null, ...event.jsPath);

    this.inputElement = createHTMLInputElement(awaitedPath, { coreFrame });
    this.acceptsMultipleFiles = event.selectMultiple;
    this.#jsPath = event.jsPath;
    this.#coreFrame = coreFrame;
  }

  public async chooseFiles(...files: { name: string; data: Buffer }[]): Promise<void> {
    if (!files.length) throw new Error(`No files were provided to send to this input`);
    if (files.length > 1 && !this.acceptsMultipleFiles) {
      throw new Error(
        `This input only supports a single file input, but ${files.length} files were supplied`,
      );
    }
    const frame = await this.#coreFrame;
    const finalFiles: { name: string; data: Buffer }[] = [];
    for (const file of files) {
      finalFiles.push(file as any);
    }
    await frame.setFileInputFiles(this.#jsPath, finalFiles);
  }
}
