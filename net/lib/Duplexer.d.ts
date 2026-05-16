import { ConnectionToClient } from '../index';
import IApiHandlers from '../interfaces/IApiHandlers';
import ConnectionToCore from './ConnectionToCore';
export default class Duplexer {
    static fromCore<TApiHandlers extends IApiHandlers, TEventSpec>(connectionToCore: ConnectionToCore<TApiHandlers, TEventSpec>, handlers: TApiHandlers): ConnectionToClient<TApiHandlers, TEventSpec>;
    static fromClient<TApiHandlers extends IApiHandlers, TEventSpec>(connectionToClient: ConnectionToClient<TApiHandlers, TEventSpec>): ConnectionToCore<TApiHandlers, TEventSpec>;
}
