import type { ScriptInput } from './_utils';

export type Args = {
  concurrency: number;
};
export function main({ args, utils: { replaceGetter } }: ScriptInput<Args>) {
  replaceGetter(self.navigator, 'hardwareConcurrency', () => args.concurrency, {
    onlyForInstance: true,
  });
}
