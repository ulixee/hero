export default interface IPageStateListenArgs {
  commands: { [id: string]: IRawCommand };
  callsite: string;
  states: string[];
}

export type IRawCommand = [frameId: number, command: string, args: any[]];
