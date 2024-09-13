import * as http from "http";

export default interface IMitmProxyToServerRequestOptions extends http.ClientRequestArgs {
  headers: { [name: string]: string };
}
