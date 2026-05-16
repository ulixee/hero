"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@double-agent/config");
class Session {
    constructor(id, userAgentId, assignmentType, sessionTracker, pluginDelegate) {
        this.assetsNotLoaded = [];
        this.expectedAssets = [];
        this.identifiers = [];
        this.pluginsRun = new Set();
        this.requests = [];
        this.profilesByPluginId = {};
        this.currentPageIndexByPluginId = {};
        this.id = id;
        this.assignmentType = assignmentType;
        this.sessionTracker = sessionTracker;
        this.pluginDelegate = pluginDelegate;
        this.userAgentId = userAgentId;
    }
    trackCurrentPageIndex(pluginId, currentPageIndex) {
        const lastPageIndex = this.currentPageIndexByPluginId[pluginId] || 0;
        if (currentPageIndex < lastPageIndex) {
            throw new Error(`You cannot go backwards in session. ${currentPageIndex} must be >= ${lastPageIndex}`);
        }
        this.currentPageIndexByPluginId[pluginId] = currentPageIndex;
    }
    generatePages() {
        const pagesByPluginId = {};
        for (const plugin of this.pluginDelegate.plugins) {
            const pages = plugin.pagesForSession(this);
            if (pages.length) {
                pagesByPluginId[plugin.id] = pages;
            }
        }
        return pagesByPluginId;
    }
    async startServers() {
        for (const plugin of this.pluginDelegate.plugins) {
            await plugin.createServersForSession(this);
        }
    }
    recordRequest(requestDetails) {
        const { userAgentString } = requestDetails;
        if (!this.userAgentString || this.userAgentString.startsWith('axios')) {
            this.setUserAgentString(userAgentString);
        }
        this.requests.push(requestDetails);
    }
    setUserAgentString(userAgentString) {
        this.userAgentString = userAgentString;
        // only do this as a backup since Chrome stopped sending valid Operating System info > 90
        if (!this.userAgentId && !userAgentString.startsWith('axios')) {
            this.userAgentId = (0, config_1.createUserAgentIdFromString)(this.userAgentString);
        }
    }
    getPluginProfileData(plugin, data) {
        if (!this.profilesByPluginId[plugin.id]) {
            this.profilesByPluginId[plugin.id] = {
                userAgentId: this.userAgentId,
                data,
            };
        }
        return this.profilesByPluginId[plugin.id].data;
    }
    savePluginProfileData(plugin, data, options = {}) {
        const profile = {
            userAgentId: this.userAgentId,
            data,
        };
        if (this.onSavePluginProfile) {
            this.onSavePluginProfile(plugin, profile, options.filenameSuffix);
        }
        if (options.keepInMemory) {
            this.profilesByPluginId[plugin.id] = profile;
        }
        else {
            delete this.profilesByPluginId[plugin.id];
        }
    }
    toJSON() {
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
    async close() {
        for (const plugin of this.pluginDelegate.plugins) {
            await plugin.closeServersForSession(this.id);
        }
    }
}
exports.default = Session;
//# sourceMappingURL=Session.js.map