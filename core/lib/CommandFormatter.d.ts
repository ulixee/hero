import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import ICommandWithResult from '../interfaces/ICommandWithResult';
export default class CommandFormatter {
    static toString(command: ICommandMeta): string;
    static parseResult(meta: ICommandMeta): ICommandWithResult;
}
export declare function formatJsPath(path: any): string;
