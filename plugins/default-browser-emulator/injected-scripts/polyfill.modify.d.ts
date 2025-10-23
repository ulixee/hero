import type { ScriptInput } from './_utils';
export type Args = {
    itemsToModify: any[];
};
export declare function main({ args, utils: { getObjectAtPath, toOriginalFn, overriddenFns, nativeToStringFunctionString, getParentAndProperty, getDescriptorInHierarchy, replaceGetter, replaceFunction, ObjectCached, ReflectCached, invocationReturnOrThrow, OtherInvocationsTracker, PathToInstanceTracker }, }: ScriptInput<Args>): void;
