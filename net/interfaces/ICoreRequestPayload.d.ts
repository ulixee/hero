import UnixTime from './IUnixTime';
import IApiHandlers, { IApiSpec } from './IApiHandlers';
export default interface ICoreRequestPayload<Handlers extends IApiHandlers, Api extends keyof Handlers> {
    command: Api;
    commandId?: number;
    messageId: string;
    startTime?: UnixTime;
    sendTime: UnixTime;
    args: IApiSpec<Handlers>[Api]['args'];
}
