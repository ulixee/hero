import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';

export default interface IRequestPayload {
  messageId: string;
  meta?: ISessionMeta;
  command: string;
  args: any[];
}
