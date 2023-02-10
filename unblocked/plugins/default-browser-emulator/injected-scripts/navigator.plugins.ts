function installNamedNodeItems(
  nativeObj: PluginArray | MimeTypeArray,
  list: (Plugin | MimeType)[],
  prop: 'type' | 'name',
) {
  const props = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    props.push(String(i));
    ObjectCached.defineProperty(nativeObj, i, {
      value: item,
      enumerable: true,
      writable: false,
      configurable: true,
    });
  }
  for (const item of list) {
    props.push(item[prop]);
    ObjectCached.defineProperty(nativeObj, item[prop], {
      value: item,
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }
  return props;
}

const uint32Overflow = 4294967296;

const weakMimes = new WeakSet<MimeType>();
const weakPlugins = new WeakSet<Plugin>();

function createNamedNodeMap(
  protoClass: PluginArray | MimeTypeArray,
  list: (Plugin | MimeType)[],
  prop: 'type' | 'name',
  hiddenProperties: PropertyKey[] = [],
) {
  const nativeObj = new Proxy(ObjectCached.create(protoClass) as PluginArray | MimeTypeArray, {
    has(target: MimeTypeArray | PluginArray, p: string | symbol): boolean {
      if (hiddenProperties.includes(p)) return false;
      return p in target;
    },
    get(target: PluginArray | MimeTypeArray, p: string | symbol, receiver: any): any {
      if (p === Symbol.toStringTag) {
        if (target === nativeObj) return protoClass[Symbol.toStringTag];
      }
      return ReflectCached.get(target, p, receiver);
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
  const mime: MimeType = ObjectCached.create(MimeType.prototype);
  proxyGetter(mime, 'type', () => fakeMime.type, true);
  proxyGetter(mime, 'suffixes', () => fakeMime.suffixes, true);
  proxyGetter(mime, 'description', () => fakeMime.description, true);
  proxyGetter(mime, 'enabledPlugin', () => navigator.plugins[fakeMime.__pluginName], true);

  weakMimes.add(mime);
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
  let plugin: Plugin = ObjectCached.create(Plugin.prototype);

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
  weakPlugins.add(plugin);

  return plugin;
});

const navigatorPlugins = createNamedNodeMap(
  PluginArray.prototype,
  pluginList,
  'name',
) as PluginArray;

proxyGetter(navigator, 'mimeTypes', () => mimes, true);
proxyGetter(navigator, 'plugins', () => navigatorPlugins, true);

function handleCloneObject(target, thisArg, argArray) {
  try {
    const args = [...argArray];
    // trigger error since mimes aren't having clone issues
    if (weakMimes.has(argArray[0])) {
      args[0] = mimes;
    }
    return ReflectCached.apply(target, thisArg, args);
  } catch (error) {
    const self = argArray[0];
    let message = error.message;
    if (message.includes('Failed to execute')) {
      if (self === navigatorPlugins) {
        message = message.replace('#<PluginArray>', 'PluginArray object');
        error.stack = error.stack.replace('#<PluginArray>', 'PluginArray object');
      } else if (self === mimes) {
        message = message.replace('#<MimeTypeArray>', 'MimeTypeArray object');
        error.stack = error.stack.replace('#<MimeTypeArray>', 'MimeTypeArray object');
      } else if (weakMimes.has(self)) {
        message = message
          .replace('#<MimeType>', 'MimeType object')
          .replace('#<MimeTypeArray>', 'MimeType object');
        error.stack = error.stack
          .replace('#<MimeType>', 'MimeType object')
          .replace('#<MimeTypeArray>', 'MimeType object');
      } else if (weakPlugins.has(self)) {
        message = message.replace('#<Plugin>', 'Plugin object');
        error.stack = error.stack.replace('#<Plugin>', 'Plugin object');
      }
      // DOMException messages are getters
      proxyGetter(error, 'message', () => message, true);
    }
    throw error;
  }
}
proxyFunction(window, 'postMessage', handleCloneObject);
proxyFunction(window, 'structuredClone', handleCloneObject);
