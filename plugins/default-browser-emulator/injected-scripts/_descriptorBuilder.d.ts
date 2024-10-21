declare const nativeErrorRegex: RegExp;
declare const globalSymbols: {};
declare function createError(message: string, type?: {
    new (msg: string): any;
}): any;
declare function newObjectConstructor(newProps: IDescriptor, path: string, invocation?: string | Function, isAsync?: boolean): () => any;
declare const prototypesByPath: {
    [path: string]: PropertyDescriptor;
};
declare function buildDescriptor(entry: IDescriptor, path: string): PropertyDescriptor;
declare function getParentAndProperty(path: string): {
    parent: any;
    property: string;
} | undefined;
declare function breakdownPath(path: string, propsToLeave: any): {
    parent: any;
    remainder: string[];
} | undefined;
declare function getObjectAtPath(path: any): any;
declare function invocationToMaybeError(invocation: any): Error | undefined;
declare function invocationReturnOrThrow(invocation: any, isAsync?: boolean): any | Promise<any>;
declare class PathToInstanceTracker {
    private static pathsToTrack;
    private static instanceToPath;
    static addPath(path: string): void;
    static getPath(instance: any): string | undefined;
    static updateAllReferences(): void;
    private static getInstanceForPath;
}
type OtherInvocationWithBaseKey = `${string}...${string}`;
declare class OtherInvocationsTracker {
    static basePaths: Set<string>;
    private static otherInvocations;
    static addOtherInvocation(basePath: string, otherKey: OtherInvocationKey, otherInvocation: any): void;
    static getOtherInvocation(basePath: string, otherThis: any): {
        invocation: any;
        path: string;
        isAsync?: boolean;
    } | undefined;
    private static key;
}
type OtherInvocationInfo = `` | `Async`;
type OtherInvocationKey = `_$otherInvocation${OtherInvocationInfo}.${string}`;
declare interface IDescriptor {
    _$flags: string;
    _$type: string;
    _$get?: any;
    _$set?: any;
    _$accessException?: string;
    _$constructorException?: string;
    _$value?: string;
    '_$$value()'?: () => string;
    _$function?: string;
    _$invocation?: string;
    _$isAsync?: boolean;
    [key: OtherInvocationKey]: string;
    _$protos?: string[];
    'new()'?: IDescriptor;
    prototype: IDescriptor;
}
