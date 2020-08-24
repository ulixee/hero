import { createPromise } from '@secret-agent/commons/utils';

interface IAcquireProxyRequest {
  sessionId: string;
  navigationUrl: string;
}

interface IReleaseProxyRequest {
  sessionId: string;
  proxyUrl: string;
}

export type AcquireProxyUrlFn = (request: IAcquireProxyRequest) => Promise<string>;
export type ReleaseProxyUrlFn = (request: IReleaseProxyRequest) => Promise<void>;

export default class UpstreamProxy {
  public static acquireProxyUrlFn?: AcquireProxyUrlFn;
  public static releaseProxyUrlFn?: ReleaseProxyUrlFn;
  private _proxyUrl: string;
  private _isReady: Promise<string>;

  constructor(readonly sessionId) {}

  public async isReady() {
    return this._isReady;
  }

  public get proxyUrl() {
    return this._proxyUrl;
  }

  public start(url: string) {
    const { promise, resolve, reject } = createPromise();
    this._isReady = promise;
    this.acquireProxyUrl(url)
      .then(resolve)
      .catch(reject);
  }

  public async close() {
    if (!this._isReady) return;

    await this.isReady();
    if (this._proxyUrl) {
      await this.releaseProxyUrl();
    }
  }

  private async acquireProxyUrl(url: string) {
    if (!UpstreamProxy.acquireProxyUrlFn) {
      return this._proxyUrl;
    }
    const proxyUrl = await UpstreamProxy.acquireProxyUrlFn({
      sessionId: this.sessionId,
      navigationUrl: url,
    });
    if (proxyUrl === undefined) {
      return this._proxyUrl;
    }
    if (this._proxyUrl && proxyUrl !== this._proxyUrl) {
      this.releaseProxyUrl();
    }
    this._proxyUrl = proxyUrl;
    return proxyUrl;
  }

  private async releaseProxyUrl() {
    const proxyUrl = this._proxyUrl;
    this._proxyUrl = null;
    await UpstreamProxy.releaseProxyUrlFn({ sessionId: this.sessionId, proxyUrl });
  }
}
