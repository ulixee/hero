export type Args = {
  callbackName: string;
};
const typedArgs = args as Args;
const cookieCallback = callback.bind(null, typedArgs.callbackName);

replaceSetter(Document.prototype, 'cookie', (target, thisArg, argArray) => {
  const cookie = argArray.at(0);
  if (cookie) {
    cookieCallback(JSON.stringify({ cookie, origin: self.location.origin }));
  }
  return ReflectCached.apply(target, thisArg, argArray!);
});
