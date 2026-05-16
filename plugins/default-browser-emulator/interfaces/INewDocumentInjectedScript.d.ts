import { TNewDocumentCallbackFn } from '@ulixee/unblocked-specification/agent/browser/IPage';
export default interface INewDocumentInjectedScript {
    script: string;
    callback?: {
        name: string;
        fn: TNewDocumentCallbackFn | null;
    };
}
