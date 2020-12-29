import ISessionMeta from './ISessionMeta';

export default interface ICoreRequestPayload {
  messageId: string;
  meta?: ISessionMeta;
  command: string;
  args: any[];
}
