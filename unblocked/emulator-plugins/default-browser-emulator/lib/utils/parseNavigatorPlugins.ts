export default function parseNavigatorPlugins(navigator: any): {
  mimeTypes: any[];
  mimesListHasRefForTypeEntry: boolean;
  plugins: any[];
} {
  const mimesJson = readDomOutput(navigator.mimeTypes);
  const mimeTypes: any[] = Object.entries(mimesJson)
    .filter(x => x[0].match(/\d+/))
    .map(x => x[1]);

  for (const mimeType of mimeTypes) {
    mimeType.hasNamedPropertyRef = !!mimesJson[mimeType.type];
  }

  const firstMimeType = (mimeTypes[0] as any).type;
  const mimesListHasRefForTypeEntry =
    typeof mimesJson[firstMimeType] === 'string' &&
    (mimesJson[firstMimeType] as string).startsWith('REF: ');

  const pluginJson = readDomOutput(navigator.plugins);
  const plugins: any[] = Object.entries(pluginJson)
    .filter(x => x[0].match(/\d+/))
    .map(x => x[1]);

  for (const plugin of plugins) {
    plugin.mimeTypes = [];
    delete plugin.length;
    for (const [pluginKey, pluginProp] of Object.entries(plugin)) {
      if (pluginKey.match(/\d+/)) {
        const mimeType = (pluginProp as any).type as string;
        delete plugin[pluginKey];
        delete plugin[mimeType];
        plugin.mimeTypes.push(mimeType);
        mimeTypes.find(x => x.type === mimeType).__pluginName = plugin.name;
      }
    }
  }

  return {
    mimeTypes,
    mimesListHasRefForTypeEntry,
    plugins,
  };
}

function readDomOutput(entry): any {
  if (entry._$type === 'object') {
    const obj = {};
    const props = Object.entries(entry);
    for (const [prop, value] of props) {
      if (prop.startsWith('_$')) continue;
      obj[prop] = readDomOutput(value);
    }
    return obj;
  }
  if (entry._$value !== undefined) {
    return entry._$value;
  }
  return entry;
}
