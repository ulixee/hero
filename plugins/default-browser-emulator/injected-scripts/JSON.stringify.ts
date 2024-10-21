import type { ScriptInput } from './_utils';

export type Args = never;

export function main({ utils: { replaceFunction, ReflectCached } }: ScriptInput<Args>) {
  replaceFunction(JSON, 'stringify', (target, thisArg, argArray) => {
    const result = ReflectCached.apply(target, thisArg, [argArray.at(0), null, 2]);
    console.log(result);
    return result;
  });
}
