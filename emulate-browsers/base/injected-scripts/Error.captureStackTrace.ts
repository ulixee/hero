proxyFunction(self.Error, 'captureStackTrace', (target, thisArg, argArray) => {
  if (argArray.length < 1) return target.apply(thisArg, argArray);

  const [addToObject] = argArray;
  const result = target.apply(thisArg, argArray);
  cleanErrorStack(addToObject as any);
  return result;
});
