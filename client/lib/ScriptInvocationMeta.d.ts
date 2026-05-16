import IScriptRunMeta from '@ulixee/hero-interfaces/IScriptInvocationMeta';
export default class ScriptInvocationMeta {
    static getScriptInvocationMeta(defaults?: Partial<IScriptRunMeta>): IScriptRunMeta;
}
