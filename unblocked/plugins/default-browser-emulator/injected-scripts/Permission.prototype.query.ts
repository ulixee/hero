proxyFunction(Permissions.prototype, 'query', (func, thisArg, argArray) => {
  const permissionDescriptor = argArray.length ? argArray[0] : null;
  if (permissionDescriptor && permissionDescriptor.name === 'notifications') {
    const state = Notification.permission === 'default' ? 'prompt' : Notification.permission;
    const result = { state };
    Object.setPrototypeOf(result, PermissionStatus.prototype);
    return Promise.resolve(result);
  }
  return func.apply(thisArg, argArray);
});
