import ICoreSession from '../interfaces/ICoreSession';
import DetachedResource from './DetachedResource';

export default class DetachedResources {
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

  async get(name: string): Promise<DetachedResource> {
    const [coreSession, sessionId] = await Promise.all([
      this.#coreSessionPromise,
      this.#sessionIdPromise,
    ]);
    const resources = await coreSession.getDetachedResources(sessionId, name);
    return resources.length ? new DetachedResource(resources[0]) : null;
  }

  async getAll(name: string): Promise<DetachedResource[]> {
    const [coreSession, sessionId] = await Promise.all([
      this.#coreSessionPromise,
      this.#sessionIdPromise,
    ]);
    const resources = await coreSession.getDetachedResources(sessionId, name);
    return resources.map(x => new DetachedResource(x));
  }
}
