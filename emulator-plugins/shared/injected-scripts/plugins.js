function installNamedNodeItems(nativeObj, list, prop) {
  const props = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    props.push(String(i));
    Object.defineProperty(nativeObj, i, {
      value: item,
      enumerable: true,
      writable: false,
      configurable: true,
    });
  }
  for (const item of list) {
    props.push(item[prop]);
    Object.defineProperty(nativeObj, item[prop], {
      value: item,
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }
  return props;
}

function createNamedNodeMap(protoClass, list, prop) {
  const nativeObj = Object.create(protoClass);

  installNamedNodeItems(nativeObj, list, prop);

  proxyDescriptors(nativeObj, {
    item: {
      func: (target, thisArg, argArray) => {
        if (!argArray || !argArray.length) return nativeKey;
        return thisArg[argArray[0]];
      },
    },
    namedItem: {
      func: (target, thisArg, argArray) => {
        if (!argArray || !argArray.length) return nativeKey;
        return thisArg[argArray[0]];
      },
    },
    refresh: {
      func: () => undefined,
    },
    [Symbol.iterator]: { func: () => [...list] },
    length: { get: () => list.length },
  });

  return nativeObj;
}

function createMime(fakeMime) {
  const mime = Object.create(MimeType.prototype);
  proxyDescriptors(mime, {
    type: { get: () => fakeMime.type },
    suffixes: { get: () => fakeMime.suffixes },
    description: { get: () => fakeMime.description },
    enabledPlugin: { get: () => navigator.plugins[fakeMime.__pluginName] },
  });
  return mime;
}

const mimeList = args.mimeTypes.map(createMime);
const mimes = createNamedNodeMap(MimeTypeArray.prototype, mimeList, 'type');

const pluginList = args.plugins.map(fakeP => {
  let plugin = Object.create(Plugin.prototype);

  const pluginMimes = args.mimeTypes.filter(m => m.__pluginName === fakeP.name);
  const mimeProps = installNamedNodeItems(plugin, pluginMimes.map(createMime), 'type');
  proxyDescriptors(plugin, {
    name: { get: () => fakeP.name },
    description: { get: () => fakeP.description },
    filename: { get: () => fakeP.filename },
    length: { get: () => pluginMimes.length },
    item: {
      func: (target, thisArg, argArray) => {
        if (!argArray || !argArray.length) return nativeKey;
        const entry = pluginMimes[argArray[0]];
        if (entry) return createMime(entry);
      },
    },
    namedItem: {
      func: (target, thisArg, argArray) => {
        if (!argArray || !argArray.length) return nativeKey;
        const match = pluginMimes.find(x => x.type === argArray[0]);
        if (match) return createMime(match);
      },
    },
    [Symbol.iterator]: { func: () => pluginMimes.map(createMime) },
  });

  plugin = new Proxy(plugin, {
    get(target, p) {
      if (mimeProps.includes(p)) {
        let fakeMime = pluginMimes.find(x => x.type === p);
        if (new RegExp(/^\d+$/).test(String(p))) {
          fakeMime = pluginMimes[p];
        }
        return createMime(fakeMime);
      }

      return target[p];
    },
  });

  return plugin;
});

const plugins = createNamedNodeMap(PluginArray.prototype, pluginList, 'name');

proxyDescriptors(window.navigator, {
  mimeTypes: { get: () => mimes },
  plugins: { get: () => plugins },
});
