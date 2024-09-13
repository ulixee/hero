import { IAssignmentType } from '@double-agent/collect-controller/interfaces/IAssignment';
import { createUserAgentIdFromString } from '@double-agent/config';
import ISession from '../interfaces/ISession';
import IAsset from '../interfaces/IAsset';
import IRequestDetails from '../interfaces/IRequestDetails';
import IUserIdentifier from '../interfaces/IUserIdentifier';
import Plugin from './Plugin';
import SessionTracker from './SessionTracker';
import PluginDelegate from './PluginDelegate';
import IBaseProfile from '../interfaces/IBaseProfile';
import ISessionPage from '../interfaces/ISessionPage';

export default class Session implements ISession {
  public readonly id: string;
  public userAgentId: string;
  public readonly assignmentType: IAssignmentType;
  public readonly assetsNotLoaded: IAsset[] = [];
  public readonly expectedAssets: (IAsset & { fromUrl?: string })[] = [];
  public expectedUserAgentString: string;

  public readonly identifiers: IUserIdentifier[] = [];
  public readonly pluginsRun: Set<string> = new Set();
  public readonly requests: IRequestDetails[] = [];
  public userAgentString: string;
  public onSavePluginProfile: (plugin: Plugin, profile: any, filenameSuffix?: string) => void;

  public readonly sessionTracker: SessionTracker;
  public readonly pluginDelegate: PluginDelegate;

  private readonly profilesByPluginId: { [pluginId: string]: IBaseProfile } = {};
  private readonly currentPageIndexByPluginId: { [pluginId: string]: number } = {};
  constructor(
    id: string,
    userAgentId: string,
    assignmentType: IAssignmentType,
    sessionTracker: SessionTracker,
    pluginDelegate: PluginDelegate,
  ) {
    this.id = id;
    this.assignmentType = assignmentType;
    this.sessionTracker = sessionTracker;
    this.pluginDelegate = pluginDelegate;
    this.userAgentId = userAgentId;
  }

  public trackCurrentPageIndex(pluginId: string, currentPageIndex: number): void {
    const lastPageIndex = this.currentPageIndexByPluginId[pluginId] || 0;
    if (currentPageIndex < lastPageIndex) {
      throw new Error(
        `You cannot go backwards in session. ${currentPageIndex} must be >= ${lastPageIndex}`,
      );
    }
    this.currentPageIndexByPluginId[pluginId] = currentPageIndex;
  }

  public generatePages(): { [pluginId: string]: ISessionPage[] } {
    const pagesByPluginId: { [pluginId: string]: ISessionPage[] } = {};
    for (const plugin of this.pluginDelegate.plugins) {
      const pages = plugin.pagesForSession(this);
      if (pages.length) {
        pagesByPluginId[plugin.id] = pages;
      }
    }
    return pagesByPluginId;
  }

  public async startServers(): Promise<void> {
    for (const plugin of this.pluginDelegate.plugins) {
      await plugin.createServersForSession(this);
    }
  }

  public recordRequest(requestDetails: IRequestDetails): void {
    const { userAgentString } = requestDetails;

    if (!this.userAgentString || this.userAgentString.startsWith('axios')) {
      this.setUserAgentString(userAgentString);
    }

    this.requests.push(requestDetails);
  }

  public setUserAgentString(userAgentString: string): void {
    this.userAgentString = userAgentString;
    // only do this as a backup since Chrome stopped sending valid Operating System info > 90
    if (!this.userAgentId && !userAgentString.startsWith('axios')) {
      this.userAgentId = createUserAgentIdFromString(this.userAgentString);
    }
  }

  public getPluginProfileData<TProfileData>(plugin: Plugin, data: TProfileData): TProfileData {
    if (!this.profilesByPluginId[plugin.id]) {
      this.profilesByPluginId[plugin.id] = {
        userAgentId: this.userAgentId,
        data,
      };
    }
    return this.profilesByPluginId[plugin.id].data;
  }

  public savePluginProfileData<TProfileData>(
    plugin: Plugin,
    data: TProfileData,
    options: { keepInMemory?: boolean; filenameSuffix?: string } = {},
  ): void {
    const profile: IBaseProfile = {
      userAgentId: this.userAgentId,
      data,
    };
    if (this.onSavePluginProfile) {
      this.onSavePluginProfile(plugin, profile, options.filenameSuffix);
    }
    if (options.keepInMemory) {
      this.profilesByPluginId[plugin.id] = profile;
    } else {
      delete this.profilesByPluginId[plugin.id];
    }
  }

  public toJSON(): any {
    return {
      id: this.id,
      assetsNotLoaded: this.assetsNotLoaded,
      expectedAssets: this.expectedAssets,
      expectedUserAgentString: this.expectedUserAgentString,
      identifiers: this.identifiers,
      pluginsRun: Array.from(this.pluginsRun),
      requests: this.requests,
      userAgentString: this.userAgentString,
    };
  }

  public async close(): Promise<void> {
    for (const plugin of this.pluginDelegate.plugins) {
      await plugin.closeServersForSession(this.id);
    }
  }
}
