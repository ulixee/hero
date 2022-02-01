import ISessionMeta from './ISessionMeta';

export default interface ICoreRequestPayload {
  messageId: string;
  meta?: ISessionMeta;
  command: string;
  commandId?: number;
  callsite?: string;
  startDate: Date;
  sendDate: Date;
  retryNumber?: number;
  activeFlowHandlerId?: number;
  args: any[];
  recordCommands?: Omit<ICoreRequestPayload, 'meta' | 'messageId' | 'sendDate'>[];
}
