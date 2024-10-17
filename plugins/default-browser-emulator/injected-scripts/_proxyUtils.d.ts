declare let sourceUrl: string;
declare let targetType: string | undefined;
declare let args: any;
declare const callback: (name: string, data: string) => void;
declare const ReflectCached: Pick<typeof Reflect, 'construct' | 'get' | 'set' | 'apply' | 'setPrototypeOf' | 'ownKeys' | 'getOwnPropertyDescriptor'>;
declare const ErrorCached: ErrorConstructor;
declare const ObjectCached: Pick<ObjectConstructor, 'setPrototypeOf' | 'getPrototypeOf' | 'getOwnPropertyNames' | 'defineProperty' | 'defineProperties' | 'create' | 'entries' | 'values' | 'keys' | 'getOwnPropertyDescriptors' | 'getOwnPropertyDescriptor' | 'hasOwn' | 'seal' | 'freeze'>;
declare const toOriginalFn: Map<any, string | Function>;
type NewFunction = (target: any, thisArg: any, argArray: any[]) => any;
type ModifyDescriptorOpts = {
    descriptorKey: 'value' | 'get' | 'set';
    onlyForInstance?: Boolean;
};
declare function internalModifyDescriptor<T, K extends keyof T>(obj: T, key: K, newFunction: NewFunction, opts: ModifyDescriptorOpts): {
    configurable?: boolean;
    enumerable?: boolean;
    value?: any;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
};
declare function replaceFunction<T, K extends keyof T>(obj: T, key: K, newFunction: NewFunction, opts?: Omit<ModifyDescriptorOpts, 'descriptorKey'>): {
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
declare const hiddenKey: string;
type SharedStorage = {
    ready: boolean;
};
declare const sharedStorage: SharedStorage;
declare function getSharedStorage(): SharedStorage | undefined;
declare let nativeToStringFunctionString: string;
declare const overriddenFns: Map<Function, string | undefined>;
declare const proxyToTarget: WeakMap<object, any>;
declare const proxyThisTracker: Map<string, any>;
declare function getPrototypeSafe(obj: any): any;
declare function runAndInjectProxyInStack(target: any, thisArg: any, argArray: any, proxy: any): unknown;
declare function proxyConstructor<T, K extends keyof T>(owner: T, key: K, overrideFn: typeof ReflectCached.construct): void;
declare const setProtoTracker: WeakSet<any>;
declare function internalCreateFnProxy<T extends Function>(opts: {
    target: T;
    descriptor?: any;
    custom?: ProxyHandler<T>;
    inner?: ProxyHandler<T> & {
        fixThisArg?: boolean;
    };
    disableStoreToString?: boolean;
}): any;
type OverrideFn = (target: Function, thisArg: any, argArray: any[]) => any;
declare function proxyFunction<T, K extends keyof T>(thisObject: T, functionName: K, overrideFn: OverrideFn, opts?: {
    overrideOnlyForInstance?: boolean;
    fixThisArg?: boolean;
}): T[K];
declare function proxyGetter<T, K extends keyof T>(thisObject: T, propertyName: K, overrideFn: OverrideFn, opts?: {
    overrideOnlyForInstance?: boolean;
}): (() => any) | undefined;
declare function proxySetter<T, K extends keyof T>(thisObject: T, propertyName: K, overrideFn: OverrideFn, opts?: {
    overrideOnlyForInstance?: boolean;
}): ((v: any) => void) | undefined;
declare function getDescriptorInHierarchy<T, K extends keyof T>(obj: T, prop: K): {
    descriptorOwner: NonNullable<T>;
    descriptor: PropertyDescriptor;
} | null;
declare function addDescriptorAfterProperty(path: string, prevProperty: string, propertyName: string, descriptor: PropertyDescriptor): void;
declare const reordersByObject: WeakMap<any, {
    propertyName: string;
    prevProperty: string;
    throughProperty: string;
}[]>;
declare function reorderNonConfigurableDescriptors(objectPath: any, propertyName: any, prevProperty: any, throughProperty: any): void;
declare function reorderDescriptor(path: any, propertyName: any, prevProperty: any, throughProperty: any): void;
declare function adjustKeyOrder(keys: any, propertyName: any, prevProperty: any, throughProperty: any): void;
