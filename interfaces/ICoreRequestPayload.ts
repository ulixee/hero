import ISessionMeta from './ISessionMeta';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';

export default interface ICoreRequestPayload {
  messageId: string;
  meta?: ISessionMeta;
  command: string;
  commandId?: number;
  callsite?: ISourceCodeLocation[];
  startDate: Date;
  sendDate: Date;
  retryNumber?: number;
  activeFlowHandlerId?: number;
  args: any[];
  recordCommands?: Omit<ICoreRequestPayload, 'meta' | 'messageId' | 'sendDate'>[];
}
