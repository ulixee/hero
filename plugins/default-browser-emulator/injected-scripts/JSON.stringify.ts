export type Args = never;

replaceFunction(JSON, 'stringify', (target, thisArg, argArray) => {
  const result = ReflectCached.apply(target, thisArg, [argArray.at(0), null, 2]);
  console.log(result);
  return result;
});
