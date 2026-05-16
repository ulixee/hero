import IApiHandlers, { IApiSpec } from './IApiHandlers';
export default interface ICoreResponsePayload<ApiHandlers extends IApiHandlers, Api extends keyof IApiSpec<ApiHandlers>> {
    responseId: string;
    data: IApiSpec<ApiHandlers>[Api]['result'];
}
