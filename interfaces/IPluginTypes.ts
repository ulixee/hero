const ClientPlugin = 'ClientPlugin';
const CorePlugin = 'CorePlugin';

const PluginTypes = {
  ClientPlugin,
  CorePlugin,
} as const;

type IPluginType = keyof typeof PluginTypes;

export { PluginTypes, IPluginType };
