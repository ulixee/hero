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

const uint32Overflow = 4294967296;

function createNamedNodeMap(
  protoClass: PluginArray | MimeTypeArray,
  list: (Plugin | MimeType)[],
  prop: 'type' | 'name',
  hiddenProperties: PropertyKey[] = [],
) {
  const nativeObj = new Proxy(Object.create(protoClass) as PluginArray | MimeTypeArray, {
    has(target: MimeTypeArray | PluginArray, p: string | symbol): boolean {
      if (hiddenProperties.includes(p)) return false;
      return p in target;
    },
  });

  installNamedNodeItems(nativeObj, list, prop);

  proxyFunction(
    nativeObj,
    // @ts-expect-error
    'hasOwnProperty',
    (target, thisArg, argArray) => {
      if (argArray && argArray.length) {
        if (hiddenProperties.includes(argArray[0])) return false;
      }
      return ProxyOverride.callOriginal;
    },
    true,
  );

  proxyFunction(
    nativeObj,
    'item',
    (target, thisArg, argArray) => {
      if (!argArray || !argArray.length) return ProxyOverride.callOriginal;
      // handle uint32 overflow
      const itemNumber = argArray[0] % uint32Overflow;
      return thisArg[itemNumber];
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
  // proxyFunction(nativeObj, Symbol.iterator, () => [...list][Symbol.iterator], true);
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
const mimes = createNamedNodeMap(
  MimeTypeArray.prototype,
  mimeList,
  'type',
  args.mimeTypes.filter(x => x.hasNamedPropertyRef === false).map(x => x.type),
) as MimeTypeArray;

const pluginList: Plugin[] = args.plugins.map(fakeP => {
  let plugin: Plugin = Object.create(Plugin.prototype);

  const pluginMimes = args.mimeTypes.filter(m => fakeP.mimeTypes.includes(m.type));
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
      // handle uint32 overflow
      const itemNumber = argArray[0] % uint32Overflow;
      const entry = pluginMimes[itemNumber];
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

proxyGetter(navigator, 'mimeTypes', () => mimes, true);
proxyGetter(navigator, 'plugins', () => navigatorPlugins, true);
