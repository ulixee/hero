import http from 'http';
import https from 'https';

export default interface IMitmProxyOptions {
  host?: string;
  port?: number;
  shouldFindAvailablePort?: boolean;
  httpAgent?: http.Agent;
  httpsAgent?: https.Agent;
  sslCaDir?: string;
  httpsPort?: number;
}
