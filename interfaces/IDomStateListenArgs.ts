export default interface IDomStateListenArgs {
  commands: { [id: string]: IRawCommand };
  callsite: string;
  name?: string;
  url?: string | RegExp;
}

export type IRawCommand = [frameId: number, command: string, args: any[]];
