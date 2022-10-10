import ICoreSession from '../interfaces/ICoreSession';

export default class CollectedSnippets {
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
        return names.snippets;
      },
    );
  }

  async get<T>(name: string): Promise<T> {
    const [coreSession, sessionId] = await Promise.all([
      this.#coreSessionPromise,
      this.#sessionIdPromise,
    ]);
    const snippets = await coreSession.getCollectedSnippets(sessionId, name);
    if (snippets.length) return snippets[0].value as T;
    return null;
  }

  async getAll<T = unknown>(name: string): Promise<T[]> {
    const [coreSession, sessionId] = await Promise.all([
      this.#coreSessionPromise,
      this.#sessionIdPromise,
    ]);
    const snippets = await coreSession.getCollectedSnippets(sessionId, name);
    return snippets.map(x => x.value);
  }
}
