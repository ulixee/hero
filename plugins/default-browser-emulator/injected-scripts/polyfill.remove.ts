import type { ScriptInput } from './_utils';

export type Args = {
  itemsToRemove: any[];
};

export function main({ args, utils: { getObjectAtPath } }: ScriptInput<Args>) {
  for (const itemToRemove of args.itemsToRemove) {
    try {
      const parent = getObjectAtPath(itemToRemove.path);
      delete parent[itemToRemove.propertyName];
    } catch (err) {
      let log = `ERROR deleting prop ${itemToRemove.path}.${itemToRemove.propertyName}`;
      if (err instanceof Error) {
        log += `\n${err.stack}`;
      }
      console.error(log);
    }
  }
}
