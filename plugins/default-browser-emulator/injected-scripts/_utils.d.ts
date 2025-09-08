import type ITypeSerializer from '@ulixee/commons/interfaces/ITypeSerializer';
export type UtilsInput = {
    sourceUrl: string;
    targetType: string;
    callback: (name: string, data: string) => void;
};
export type ScriptInput<T extends Record<string, unknown> | never> = {
    utils: Exclude<ReturnType<typeof main>, undefined>;
    TypeSerializer: ITypeSerializer;
    args: T;
} & UtilsInput;
export declare function main({ sourceUrl }: UtilsInput): {
    replaceFunction: typeof replaceFunction;
    replaceGetter: typeof replaceGetter;
    replaceSetter: typeof replaceSetter;
    ReflectCached: Pick<typeof Reflect, "construct" | "get" | "set" | "apply" | "setPrototypeOf" | "ownKeys" | "getOwnPropertyDescriptor">;
    ObjectCached: Pick<ObjectConstructor, "setPrototypeOf" | "getOwnPropertyDescriptor" | "getPrototypeOf" | "getOwnPropertyNames" | "defineProperty" | "defineProperties" | "create" | "entries" | "values" | "keys" | "getOwnPropertyDescriptors" | "hasOwn" | "seal" | "freeze">;
    proxyToTarget: WeakMap<object, any>;
    toOriginalFn: Map<any, string | Function>;
    addDescriptorAfterProperty: typeof addDescriptorAfterProperty;
    buildDescriptor: typeof buildDescriptor;
    PathToInstanceTracker: typeof PathToInstanceTracker;
    getObjectAtPath: typeof getObjectAtPath;
    overriddenFns: Map<Function, string | undefined>;
    nativeToStringFunctionString: string;
    getParentAndProperty: typeof getParentAndProperty;
    getDescriptorInHierarchy: typeof getDescriptorInHierarchy;
    invocationReturnOrThrow: typeof invocationReturnOrThrow;
    OtherInvocationsTracker: typeof OtherInvocationsTracker;
    reorderNonConfigurableDescriptors: typeof reorderNonConfigurableDescriptors;
    reorderDescriptor: typeof reorderDescriptor;
    getSharedStorage: () => {
        ready: boolean;
    } | undefined;
} | undefined;
type NewFunction = (target: any, thisArg: any, argArray: any[]) => any;
type ModifyDescriptorOpts = {
    descriptorKey: 'value' | 'get' | 'set';
    onlyForInstance?: boolean;
};
export declare function replaceFunction<T, K extends keyof T>(obj: T, key: K, newFunction: NewFunction, opts?: Omit<ModifyDescriptorOpts, 'descriptorKey'>): {
    configurable?: boolean;
    enumerable?: boolean;
    value?: any;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
};
declare function replaceGetter<T, K extends keyof T>(obj: T, key: K, newFunction: NewFunction, opts?: Omit<ModifyDescriptorOpts, 'descriptorKey'>): {
    configurable?: boolean;
    enumerable?: boolean;
    value?: any;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
};
declare function replaceSetter<T, K extends keyof T>(obj: T, key: K, newFunction: NewFunction, opts?: Omit<ModifyDescriptorOpts, 'descriptorKey'>): {
    configurable?: boolean;
    enumerable?: boolean;
    value?: any;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
};
declare function getDescriptorInHierarchy<T, K extends keyof T>(obj: T, prop: K): {
    descriptorOwner: NonNullable<T>;
    descriptor: PropertyDescriptor;
} | null;
declare function addDescriptorAfterProperty(path: string, prevProperty: string, propertyName: string, descriptor: PropertyDescriptor): void;
declare function reorderNonConfigurableDescriptors(objectPath: any, propertyName: any, prevProperty: any, throughProperty: any): void;
declare function reorderDescriptor(path: any, propertyName: any, prevProperty: any, throughProperty: any): void;
declare function buildDescriptor(entry: IDescriptor, path: string): PropertyDescriptor;
declare function getParentAndProperty(path: string): {
    parent: any;
    property: string;
} | undefined;
declare function getObjectAtPath(path: any): any;
declare function invocationReturnOrThrow(invocation: any, isAsync?: boolean): any | Promise<any>;
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
declare class PathToInstanceTracker {
    private static pathsToTrack;
    private static instanceToPath;
    static addPath(path: string): void;
    static getPath(instance: any): string | undefined;
    static updateAllReferences(): void;
    private static getInstanceForPath;
}
export {};
