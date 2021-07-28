import '@ulixee/commons/lib/SourceMapSupport';
import * as Http from 'http';
import * as QueryString from 'qs';
import { URL } from 'url';
import ConnectionToClientApi from '@ulixee/hero-core/connections/ConnectionToClientApi';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import { ICoreApiRequest, ICoreApiResponse } from '@ulixee/hero-core/apis';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';

let idCounter = 0;
class CoreApiServer extends ConnectionToClientApi {
  private readonly httpServer: Http.Server;
  private pendingMessagesById = new Map<string, (result: ICoreApiResponse<any>) => any>();

  constructor(port: number) {
    super();
    this.httpServer = new Http.Server(this.onRequest.bind(this));
    this.httpServer.listen(port);
    this.on('message', this.onMessage.bind(this));
  }

  public close(): void {
    try {
      this.httpServer.close();
    } catch (error) {
      console.log('Error closing socket connections', error);
    }
  }

  private onMessage(event: ICoreApiResponse<any>) {
    this.pendingMessagesById.get(event.responseId)(event);
    this.pendingMessagesById.delete(event.responseId);
  }

  private queueRequest(request: ICoreApiRequest<any>): Promise<ICoreApiResponse<any>> {
    if (!request.messageId) {
      idCounter += 1;
      request.messageId = `msg${idCounter}`;
    }
    return new Promise<ICoreApiResponse<any>>(resolve => {
      this.pendingMessagesById.set(request.messageId, resolve);
    });
  }

  // This example server expects requests of the format: http://localhost:1337/Session.find with a request body containing the data.
  // No MessageId is needed.
  //
  // NOTE: Change this to meet your requirements
  private async onRequest(req: Http.IncomingMessage, res: Http.ServerResponse): Promise<void> {
    try {
      const body: Buffer[] = [];
      for await (const chunk of req) {
        body.push(chunk);
      }
      const bodyText = Buffer.concat(body).toString();
      const url = new URL(req.url, 'http://localhost/');
      const api = url.pathname.replace(/\//g, '') as any;
      let args: any;
      if (req.headers['content-type'] === 'text/json') {
        args = JSON.parse(bodyText);
      } else {
        args = QueryString.parse(bodyText);
      }
      console.log('Api request', api, args);

      // we inject our own messageId so you don't have to add one to the http request
      const apiRequest = { args, api } as ICoreApiRequest<any>;
      const resultPromise = this.queueRequest(apiRequest);

      await this.handleRequest(apiRequest);

      const result = await resultPromise;

      console.log('Api response', api, result);

      res.writeHead(200, {
        'Content-Type': 'text/json',
      });
      res.end(TypeSerializer.stringify(result));
    } catch (err) {
      console.log('Error in request', req.url, err);
      res.writeHead(500);
      res.end(err.toString());
    }
  }
}

(() => {
  const server = new CoreApiServer(1337);
  ShutdownHandler.register(() => {
    server.close();
    return Promise.resolve();
  });
})();
