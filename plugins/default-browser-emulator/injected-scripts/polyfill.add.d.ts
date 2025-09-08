import type { ScriptInput } from './_utils';
export type Args = {
    itemsToAdd: any[];
};
export declare function main({ args, utils: { addDescriptorAfterProperty, buildDescriptor, PathToInstanceTracker }, }: ScriptInput<Args>): void;
