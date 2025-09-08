import { IncomingMessage, ServerResponse } from 'http';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import ITransport from '../interfaces/ITransport';
import ConnectionToClient from './ConnectionToClient';
import { IAsyncFunc } from '../interfaces/IApiHandlers';
import IApiHandler from '../interfaces/IApiHandler';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
export default class ApiRegistry<IHandlerMetadata = any> {
    apiHandlerMetadataFn: (apiRequest: ICoreRequestPayload<any, any>, logger: IBoundLog, remoteId: string) => IHandlerMetadata;
    handlersByCommand: {
        [command: string]: IAsyncFunc;
    };
    constructor(endpoints?: IApiHandler[]);
    hasHandlerForPath(path: string): boolean;
    register(...endpoints: IApiHandler[]): void;
    createConnection(transport: ITransport, handlerMetadata?: IHandlerMetadata): ConnectionToClient<any, any>;
    handleHttpRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
}
