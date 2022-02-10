import ScriptInstance from './ScriptInstance';

export const InternalPropertiesSymbol = Symbol.for('@ulixee/internalModuleState');

export const scriptInstance = new ScriptInstance();
