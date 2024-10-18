import type { ScriptInput } from './_utils';

export type Args = {
  callbackName: string;
};
export function main({
  args,
  callback,
  utils: { replaceSetter, ReflectCached },
}: ScriptInput<Args>) {
  const cookieCallback = callback.bind(null, args.callbackName);

  replaceSetter(Document.prototype, 'cookie', (target, thisArg, argArray) => {
    const cookie = argArray.at(0);
    if (cookie) {
      cookieCallback(JSON.stringify({ cookie, origin: self.location.origin }));
    }
    return ReflectCached.apply(target, thisArg, argArray!);
  });
}
