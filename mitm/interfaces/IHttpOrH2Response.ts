import { IncomingHttpHeaders } from 'http';
import http2 from 'http2';

export default interface IHttpOrH2Response extends NodeJS.ReadableStream {
  statusCode?: number;
  statusMessage?: string;
  method?: string;
  url?: string;
  rawHeaders: string[];
  responseTime?: Date;
  headers: IncomingHttpHeaders | http2.IncomingHttpHeaders;
}
