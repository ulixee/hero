import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';
import CallsiteLocator from '../lib/CallsiteLocator';
import ConnectionToHeroCore from './ConnectionToHeroCore';
export default class ConnectionFactory {
    static hasLocalCloudPackage: boolean;
    static createConnection(options: IConnectionToCoreOptions | ConnectionToHeroCore, callsiteLocator?: CallsiteLocator): ConnectionToHeroCore;
}
