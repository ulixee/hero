export default interface ICoreResponsePayload {
  responseId?: string;
  commandId?: number;
  data: any;
  isError?: boolean;
}
