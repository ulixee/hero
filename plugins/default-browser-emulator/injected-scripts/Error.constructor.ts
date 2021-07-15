proxyConstructor(self, 'Error', function () {
  const err = ReflectCached.construct(...arguments);
  cleanErrorStack(err);
  return err;
});
