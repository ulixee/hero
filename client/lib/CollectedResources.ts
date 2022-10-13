import ICoreSession from '../interfaces/ICoreSession';
import CollectedResource from './CollectedResource';

export default class CollectedResources {
  readonly #coreSessionPromise: Promise<ICoreSession>;
  readonly #sessionIdPromise: Promise<string>;

  constructor(coreSessionPromise: Promise<ICoreSession>, sessionIdPromise: Promise<string>) {
    this.#coreSessionPromise = coreSessionPromise;
    this.#sessionIdPromise = sessionIdPromise;
  }

  get names(): Promise<string[]> {
    return Promise.all([this.#coreSessionPromise, this.#sessionIdPromise]).then(
      async ([coreSession, sessionId]) => {
        const names = await coreSession.getCollectedAssetNames(sessionId);
        return names.resources;
      },
    );
  }

  async get(name: string): Promise<CollectedResource> {
    const [coreSession, sessionId] = await Promise.all([
      this.#coreSessionPromise,
      this.#sessionIdPromise,
    ]);
    const resources = await coreSession.getCollectedResources(sessionId, name);
    return resources.length ? new CollectedResource(resources[0]) : null;
  }

  async getAll(name: string): Promise<CollectedResource[]> {
    const [coreSession, sessionId] = await Promise.all([
      this.#coreSessionPromise,
      this.#sessionIdPromise,
    ]);
    const resources = await coreSession.getCollectedResources(sessionId, name);
    return resources.map(x => new CollectedResource(x));
  }
}
