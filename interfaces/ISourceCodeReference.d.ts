import type ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
export default interface ISourceCodeReference {
    sourcecode: (ISourceCodeLocation & {
        code: string;
    })[];
}
