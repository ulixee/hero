declare const PluginTypes: {
    readonly ClientPlugin: "ClientPlugin";
    readonly CorePlugin: "CorePlugin";
};
type IPluginType = keyof typeof PluginTypes;
export { PluginTypes, IPluginType };
