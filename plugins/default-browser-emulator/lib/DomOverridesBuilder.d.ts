import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import INewDocumentInjectedScript from '../interfaces/INewDocumentInjectedScript';
import IBrowserEmulatorConfig, { InjectedScript } from '../interfaces/IBrowserEmulatorConfig';
declare const injectedSourceUrl: string;
export { injectedSourceUrl };
export default class DomOverridesBuilder {
    private readonly config?;
    private readonly scriptsByName;
    private readonly alwaysPageScripts;
    private readonly alwaysWorkerScripts;
    private workerOverrides;
    constructor(config?: IBrowserEmulatorConfig);
    getWorkerOverrides(): string[];
    build(type?: 'worker' | 'service_worker' | 'shared_worker' | 'page', scriptNames?: string[]): {
        script: string;
        callbacks: INewDocumentInjectedScript['callback'][];
    };
    registerWorkerOverrides(...names: InjectedScript[]): void;
    add<T = undefined>(name: InjectedScript, args?: T, registerWorkerOverride?: boolean): void;
    addPageScript(script: string, args: Record<string, any> & {
        callbackName?: string;
    }, callbackFn?: (data: string, frame: IFrame) => any): void;
    addOverrideAndUseConfig<T extends InjectedScript>(injectedScript: T, defaultConfig: IBrowserEmulatorConfig[T], opts?: {
        registerWorkerOverride?: boolean;
    }): void;
    cleanup(): void;
    addWorkerScript(script: string, args?: any): void;
    private wrapScript;
}
export declare function getOverrideScript(name: InjectedScript, args?: any): {
    script: string;
    callbacks: INewDocumentInjectedScript['callback'][];
};
