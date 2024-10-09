// TODO rename/extend this for future use cases
export interface IWebsocketEvents {
  'message-received': { id: string; name: string; payload: string };
}

export type WebsocketCallback = (name: string, payload: string) => void;
