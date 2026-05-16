import { INodePointer, IElementRect, IJsPath, INodeVisibility } from '@ulixee/js-path';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IPoint from '@ulixee/unblocked-specification/agent/browser/IPoint';
import IJsPathFunctions from '@ulixee/unblocked-specification/agent/browser/IJsPathFunctions';
import Frame from './Frame';
export type ISerializable = number | string | boolean | null | ISerializable[] | IJSONObject | IPoint;
interface IJSONObject {
    [key: string]: ISerializable;
}
export declare class JsPath implements IJsPathFunctions {
    private readonly frame;
    private readonly logger;
    private readonly clientRectByNodePointerId;
    private readonly nodeIdRedirectToNewNodeId;
    private nodeIdToJsPathSource;
    constructor(frame: Frame, logger: IBoundLog);
    getLastClientRect(nodeId: number): IElementRect;
    getClientRect(jsPath: IJsPath, includeNodeVisibility?: boolean): Promise<IExecJsPathResult<IElementRect>>;
    exec<T>(jsPath: IJsPath, timeoutMs?: number): Promise<IExecJsPathResult<T>>;
    reloadJsPath<T>(jsPath: IJsPath, containerOffset: IPoint): Promise<IExecJsPathResult<T>>;
    getNodePointerId(jsPath: IJsPath): Promise<number>;
    getNodePointer<T>(jsPath: IJsPath, containerOffset?: IPoint): Promise<IExecJsPathResult<T>>;
    getNodeVisibility(jsPath: IJsPath): Promise<INodeVisibility>;
    simulateOptionClick(jsPath: IJsPath): Promise<IExecJsPathResult<boolean>>;
    getSourceJsPath(nodePointer: INodePointer): IJsPath;
    protected replaceRedirectedJsPathNodePointer(jsPath: IJsPath): void;
    private runJsPath;
    private runInjectedScriptFn;
    private getJsPathHistoryForNode;
    private recordExecResult;
    private getJsPathMethod;
}
export interface IJsPathHistory {
    jsPath: IJsPath;
    sourceIndex?: number;
}
export {};
