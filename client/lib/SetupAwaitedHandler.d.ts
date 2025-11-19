import AwaitedHandler from '@ulixee/awaited-dom/base/AwaitedHandler';
import { IJsPath, INodePointer } from '@ulixee/js-path';
import AwaitedPath from '@ulixee/awaited-dom/base/AwaitedPath';
import Constructable from '@ulixee/awaited-dom/base/Constructable';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import CoreFrameEnvironment from './CoreFrameEnvironment';
export declare const delegate: {
    getProperty: typeof getProperty;
    setProperty: typeof setProperty;
    construct: typeof construct;
    runMethod: typeof runMethod;
    runStatic: typeof runStatic;
    createNodePointer: typeof createNodePointer;
};
interface IStateHandler<TClass> {
    getState(instance: TClass): any;
    setState(instance: TClass, properties: any): void;
    className?: string;
}
export declare function isAwaitedNode(node: any): boolean;
declare function getProperty<T, TClass>(stateHandler: IStateHandler<TClass>, instance: TClass, name: string): Promise<T>;
declare function setProperty<T, TClass>(stateHandler: IStateHandler<TClass>, instance: TClass, name: string, value: T): Promise<void>;
declare function runMethod<T, TClass>(stateHandler: IStateHandler<TClass>, instance: TClass, name: string, args: any[]): Promise<T>;
declare function createNodePointer<TClass>(stateHandler: IStateHandler<TClass>, instance: TClass): Promise<INodePointer>;
declare function runStatic<T, TClass>(stateHandler: IStateHandler<TClass>, _klass: Constructable<TClass>, name: string): T;
declare function construct<TClass>(self: AwaitedHandler<TClass>): TClass;
export declare function getAwaitedState<TClass>(stateHandler: IStateHandler<TClass>, instance: TClass): Promise<{
    awaitedPath: AwaitedPath;
    coreFrame: CoreFrameEnvironment;
    awaitedOptions: IAwaitedOptions;
}>;
export declare function getAwaitedPathAsMethodArg(awaitedPath: AwaitedPath): string;
export declare function createInstanceWithNodePointer<TClass>(stateHandler: IStateHandler<TClass>, awaitedPath: AwaitedPath, awaitedOptions: IAwaitedOptions, nodePointer: INodePointer): TClass;
export declare function convertJsPathArgs(path: IJsPath): void;
export declare function execJsPath<T>(coreFrame: CoreFrameEnvironment, awaitedOptions: IAwaitedOptions, path: IJsPath): Promise<IExecJsPathResult<T>>;
export declare function cleanResult<T, TClass>(stateHandler: IStateHandler<TClass>, instance: TClass, result: IExecJsPathResult<T>, startStack: string): T;
export {};
