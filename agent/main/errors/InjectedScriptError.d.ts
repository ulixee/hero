import { IPathStep } from '@ulixee/js-path';
export default class InjectedScriptError extends Error {
    private readonly pathState;
    constructor(message: string, pathState?: {
        step: IPathStep;
        index: number;
    });
    toJSON(): object;
}
