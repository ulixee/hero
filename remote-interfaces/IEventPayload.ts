import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';

export default interface IEventPayload {
  meta: ISessionMeta;
  listenerId: string;
  eventArgs: any[];
}
