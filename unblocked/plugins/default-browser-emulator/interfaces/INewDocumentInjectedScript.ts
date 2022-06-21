import { IFrame } from '@unblocked-web/specifications/agent/browser/IFrame';

export default interface INewDocumentInjectedScript {
  script: string;
  callback?: { name: string; fn: (data: string, frame: IFrame) => void }
}
