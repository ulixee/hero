import { IAssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import ISession from '../interfaces/ISession';
import IAsset from '../interfaces/IAsset';
import IRequestDetails from '../interfaces/IRequestDetails';
import IUserIdentifier from '../interfaces/IUserIdentifier';
import Plugin from './Plugin';
import SessionTracker from './SessionTracker';
import PluginDelegate from './PluginDelegate';
import ISessionPage from '../interfaces/ISessionPage';
export default class Session implements ISession {
    readonly id: string;
    userAgentId: string;
    readonly assignmentType: IAssignmentType;
    readonly assetsNotLoaded: IAsset[];
    readonly expectedAssets: (IAsset & {
        fromUrl?: string;
    })[];
    expectedUserAgentString: string;
    readonly identifiers: IUserIdentifier[];
    readonly pluginsRun: Set<string>;
    readonly requests: IRequestDetails[];
    userAgentString: string;
    onSavePluginProfile: (plugin: Plugin, profile: any, filenameSuffix?: string) => void;
    readonly sessionTracker: SessionTracker;
    readonly pluginDelegate: PluginDelegate;
    private readonly profilesByPluginId;
    private readonly currentPageIndexByPluginId;
    constructor(id: string, userAgentId: string, assignmentType: IAssignmentType, sessionTracker: SessionTracker, pluginDelegate: PluginDelegate);
    trackCurrentPageIndex(pluginId: string, currentPageIndex: number): void;
    generatePages(): {
        [pluginId: string]: ISessionPage[];
    };
    startServers(): Promise<void>;
    recordRequest(requestDetails: IRequestDetails): void;
    setUserAgentString(userAgentString: string): void;
    getPluginProfileData<TProfileData>(plugin: Plugin, data: TProfileData): TProfileData;
    savePluginProfileData<TProfileData>(plugin: Plugin, data: TProfileData, options?: {
        keepInMemory?: boolean;
        filenameSuffix?: string;
    }): void;
    toJSON(): any;
    close(): Promise<void>;
}
