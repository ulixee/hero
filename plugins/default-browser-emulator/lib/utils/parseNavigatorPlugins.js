"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseNavigatorPlugins;
function parseNavigatorPlugins(navigator) {
    const mimesJson = readDomOutput(navigator.mimeTypes);
    const mimeTypes = Object.entries(mimesJson)
        .filter(x => x[0].match(/\d+/))
        .map(x => x[1]);
    for (const mimeType of mimeTypes) {
        mimeType.hasNamedPropertyRef = !!mimesJson[mimeType.type];
    }
    const firstMimeType = mimeTypes[0].type;
    const mimesListHasRefForTypeEntry = typeof mimesJson[firstMimeType] === 'string' &&
        mimesJson[firstMimeType].startsWith('REF: ');
    const pluginJson = readDomOutput(navigator.plugins);
    const plugins = Object.entries(pluginJson)
        .filter(x => x[0].match(/\d+/))
        .map(x => x[1]);
    for (const plugin of plugins) {
        plugin.mimeTypes = [];
        delete plugin.length;
        for (const [pluginKey, pluginProp] of Object.entries(plugin)) {
            if (pluginKey.match(/\d+/)) {
                const mimeType = pluginProp.type;
                delete plugin[pluginKey];
                delete plugin[mimeType];
                plugin.mimeTypes.push(mimeType);
                // TODO: extract `enabledPlugin.name` during dom extraction.
                mimeTypes.find(x => x.type === mimeType).__pluginName ??= plugin.name;
            }
        }
    }
    return {
        mimeTypes,
        mimesListHasRefForTypeEntry,
        plugins,
    };
}
function readDomOutput(entry) {
    if (entry._$type === 'object') {
        const obj = {};
        const props = Object.entries(entry);
        for (const [prop, value] of props) {
            if (prop.startsWith('_$'))
                continue;
            obj[prop] = readDomOutput(value);
        }
        return obj;
    }
    if (entry._$value !== undefined) {
        return entry._$value;
    }
    return entry;
}
//# sourceMappingURL=parseNavigatorPlugins.js.map