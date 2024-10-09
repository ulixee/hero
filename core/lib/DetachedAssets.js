"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DetachedAssets {
    static getNames(db) {
        return Promise.resolve(db.getCollectedAssetNames());
    }
    static getSnippets(db, name) {
        return db.snippets.getByName(name);
    }
    static getResources(db, name) {
        if (!db.readonly)
            db.flush();
        const resources = db.detachedResources.getByName(name).map(async (x) => {
            const resource = await db.resources.getMeta(x.resourceId, true);
            const detachedResource = {
                ...x,
                resource,
            };
            if (resource.type === 'Websocket') {
                detachedResource.websocketMessages = db.websocketMessages.getTranslatedMessages(resource.id);
            }
            return detachedResource;
        });
        return Promise.all(resources);
    }
    static getElements(db, name) {
        if (!db.readonly)
            db.flush();
        return db.detachedElements.getByName(name);
    }
}
exports.default = DetachedAssets;
//# sourceMappingURL=DetachedAssets.js.map