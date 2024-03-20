proxyFunction(JSON, 'stringify', (target, thisArg, argArray) => {
  argArray[1] = null;
  argArray[2] = 2;

  const result = target.apply(thisArg, argArray);
  console.log(result);

  return result;
});
