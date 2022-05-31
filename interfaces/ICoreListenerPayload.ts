import ISessionMeta from './ISessionMeta';
import type ICoreEventPayload from '@ulixee/net/interfaces/ICoreEventPayload';

export default interface ICoreListenerPayload extends ICoreEventPayload<any, any> {
  meta: ISessionMeta;
  lastCommandId?: number;
}
