export default interface IHttpOrH2Response extends NodeJS.ReadableStream {
  statusCode?: number;
  statusMessage?: string;
}
