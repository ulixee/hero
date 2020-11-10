function installNamedNodeItems(
  nativeObj: PluginArray | MimeTypeArray,
  list: (Plugin | MimeType)[],
  prop: 'type' | 'name',
) {
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

function createNamedNodeMap(
  protoClass: PluginArray | MimeTypeArray,
  list: (Plugin | MimeType)[],
  prop: 'type' | 'name',
) {
  const nativeObj = Object.create(protoClass) as PluginArray | MimeTypeArray;

  installNamedNodeItems(nativeObj, list, prop);

  proxyFunction(
    nativeObj,
    'item',
    (target, thisArg, argArray) => {
      if (!argArray || !argArray.length) return ProxyOverride.callOriginal;
      return thisArg[argArray[0]];
    },
    true,
  );
  proxyFunction(
    nativeObj,
    'namedItem',
    (target, thisArg, argArray) => {
      if (!argArray || !argArray.length) return ProxyOverride.callOriginal;
      return thisArg[argArray[0]];
    },
    true,
  );
  if (nativeObj instanceof PluginArray) {
    proxyFunction(nativeObj, 'refresh', () => undefined, true);
  }
  // @ts-ignore - seems to be missing from ts def
  // proxyFunction(nativeObj, Symbol.iterator, () => [...list], true);
  proxyGetter(nativeObj, 'length', () => list.length, true);
  return nativeObj;
}

function createMime(fakeMime) {
  const mime: MimeType = Object.create(MimeType.prototype);
  proxyGetter(mime, 'type', () => fakeMime.type, true);
  proxyGetter(mime, 'suffixes', () => fakeMime.suffixes, true);
  proxyGetter(mime, 'description', () => fakeMime.description, true);
  proxyGetter(mime, 'enabledPlugin', () => navigator.plugins[fakeMime.__pluginName], true);
  return mime;
}

const mimeList: MimeType[] = args.mimeTypes.map(createMime);
const mimes = createNamedNodeMap(MimeTypeArray.prototype, mimeList, 'type') as MimeTypeArray;

const pluginList: Plugin[] = args.plugins.map(fakeP => {
  let plugin: Plugin = Object.create(Plugin.prototype);

  const pluginMimes = args.mimeTypes.filter(m => m.__pluginName === fakeP.name);
  const mimeProps = installNamedNodeItems(plugin, pluginMimes.map(createMime), 'type');

  proxyGetter(plugin, 'name', () => fakeP.name, true);
  proxyGetter(plugin, 'description', () => fakeP.description, true);
  proxyGetter(plugin, 'filename', () => fakeP.filename, true);
  proxyGetter(plugin, 'length', () => pluginMimes.length, true);
  proxyFunction(
    plugin,
    'item',
    (target, thisArg, argArray) => {
      if (!argArray || !argArray.length) return ProxyOverride.callOriginal;
      const entry = pluginMimes[argArray[0]];
      if (entry) return createMime(entry);
    },
    true,
  );
  proxyFunction(
    plugin,
    'namedItem',
    (_, __, argArray) => {
      if (!argArray || !argArray.length) return ProxyOverride.callOriginal;
      const match = pluginMimes.find(x => x.type === argArray[0]);
      if (match) return createMime(match);
    },
    true,
  );

  // @ts-ignore - Typescript has problems pulling in extensions like Symbol.iterator
  // proxyFunction(plugin, Symbol.iterator, () => [...pluginMimes.map(createMime)], true);

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

const navigatorPlugins = createNamedNodeMap(
  PluginArray.prototype,
  pluginList,
  'name',
) as PluginArray;

proxyGetter(window.navigator, 'mimeTypes', () => mimes, true);
proxyGetter(window.navigator, 'plugins', () => navigatorPlugins, true);
