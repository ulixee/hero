import IDataSnippet from '@ulixee/hero-interfaces/IDataSnippet';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import SessionDb from '../dbs/SessionDb';

export default class DetachedAssets {
  public static getNames(db: SessionDb): Promise<{
    resources: string[];
    elements: string[];
    snippets: string[];
  }> {
    return Promise.resolve(db.getCollectedAssetNames());
  }

  public static getSnippets(db: SessionDb, name: string): IDataSnippet[] {
    return db.snippets.getByName(name);
  }

  public static getResources(
    db: SessionDb,
    name: string,
  ): Promise<IDetachedResource[]> {
    if (!db.readonly) db.flush();
    const resources = db.detachedResources.getByName(name).map(async x => {
      const resource = await db.resources.getMeta(x.resourceId, true);
      const detachedResource = {
        ...x,
        resource,
      } as IDetachedResource;

      if (resource.type === 'Websocket') {
        detachedResource.websocketMessages = db.websocketMessages.getTranslatedMessages(
          resource.id,
        );
      }

      return detachedResource;
    });
    return Promise.all(resources);
  }

  public static getElements(db: SessionDb, name: string): IDetachedElement[] {
    if (!db.readonly) db.flush();
    return db.detachedElements.getByName(name);
  }
}
