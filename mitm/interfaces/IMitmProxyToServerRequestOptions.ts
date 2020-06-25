import * as http from 'http';
import * as https from 'https';

export default interface IMitmProxyToServerRequestOptions extends http.ClientRequestArgs {
  headers: { [name: string]: string };
}
