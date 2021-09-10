import ISessionMeta from './ISessionMeta';

export default interface ICoreEventPayload {
  meta: ISessionMeta;
  listenerId: string;
  eventArgs: any[];
  lastCommandId?: number;
}
