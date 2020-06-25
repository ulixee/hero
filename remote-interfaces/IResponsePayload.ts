export default interface IResponsePayload {
  responseId: string;
  commandId: number;
  data: any;
  isError?: boolean;
}
