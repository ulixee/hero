// TODO rename/extend this for future use cases
export interface IConsoleEvents {
  'callback-received': { id: string; name: string; payload: string };
}

export type ConsoleCallback = (name: string, payload: string) => void;
