import type { ScriptInput } from './_utils';
export type Args = {
    itemsToReorder: any[];
};
export declare function main({ args, utils: { reorderNonConfigurableDescriptors, reorderDescriptor }, }: ScriptInput<Args>): void;
