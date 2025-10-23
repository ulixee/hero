import { IElementRect, IJsPath, INodePointer } from '@ulixee/js-path';
import IExecJsPathResult from './IExecJsPathResult';
import IPoint from "./IPoint";
declare const getNodePointerFnName = "__getNodePointer__";
declare const getClientRectFnName = "__getClientRect__";
declare const getComputedVisibilityFnName = "__getComputedVisibility__";
declare const getComputedStyleFnName = "__getComputedStyle__";
declare const isFocusedFnName = "__isFocused__";
declare const getNodeIdFnName = "__getNodeId__";
export default interface IJsPathFunctions {
    getLastClientRect(nodeId: number): IElementRect;
    exec<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>>;
    reloadJsPath<T>(jsPath: IJsPath, containerOffset: IPoint): Promise<IExecJsPathResult<T>>;
    getSourceJsPath(nodePointer: INodePointer): IJsPath;
    getNodePointer<T>(jsPath: IJsPath, containerOffset?: IPoint): Promise<IExecJsPathResult<T>>;
    getNodePointerId(jsPath: IJsPath): Promise<number>;
    simulateOptionClick(jsPath: IJsPath): Promise<IExecJsPathResult<boolean>>;
}
export { getNodePointerFnName, getClientRectFnName, getNodeIdFnName, getComputedStyleFnName, isFocusedFnName, getComputedVisibilityFnName, };
