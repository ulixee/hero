delete Navigator.prototype.webdriver;

const props = {};
const languages = args.languages;
if (languages) {
  for (const i of languages) {
    Object.defineProperty(languages, i, {
      ...Object.getOwnPropertyDescriptor(languages, i),
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }
  Object.seal(languages);
  Object.freeze(languages);
  props.languages = { get: () => languages };
  props.language = { get: () => languages[0] };
}

if (args.platform) {
  props.platform = { get: () => args.platform };
}
if (args.memory) {
  props.deviceMemory = { get: () => args.memory };
}

proxyDescriptors(window.navigator, props);

if (args.ensureOneVideoDevice) {
  if (
    navigator.mediaDevices &&
    navigator.mediaDevices.enumerateDevices &&
    navigator.mediaDevices.enumerateDevices.name !== 'bound reportBlock'
  ) {
    proxyFunction(MediaDevices.prototype, 'enumerateDevices', (func, thisObj, ...args) => {
      return func.apply(thisObj, args).then(list => {
        if (list.find(x => x.kind === 'videoinput')) return list;
        list.push({
          deviceId:
            args.ensureOneVideoDevice.deviceId ||
            '34af339e7d636e6372d65f50b56e774f7cd13e127c2a48ea6d022fbdf82bed3c',
          groupId:
            args.ensureOneVideoDevice.groupId ||
            'cd04412d4be125b24466d2731b0eb1e30253d0c83b158e08e206e00e9e2975bb',
          kind: 'videoinput',
          label: '',
        });
        return list;
      });
    });
  }
}

proxyFunction(Permissions.prototype, 'query', (func, thisArg, parameters) => {
  if (parameters && parameters.name === 'notifications') {
    return Promise.resolve({ state: Notification.permission, onchange: null });
  }
  return func.apply(thisArg, parameters);
});

proxyDescriptors(Notification, {
  permission: {
    get() {
      return 'default';
    },
  },
});
