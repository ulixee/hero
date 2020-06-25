# UpstreamProxy

> UpstreamProxy allows you to proxy all traffic made from Chromium (eg, http, websockets, etc).

IP rotation is frequently needed to ensure every scraping Session you perform cannot be "lumped together" by an end website. UpstreamProxy is how you can configure an external proxy service to change the "source ip" of your HTTP traffic.

Many VPN services provide proxy options, and you can get finer grained control using commercial proxy services like [Luminati](https://luminati.io/).

## Constructor

This class should not be instantiated. You should set the callbacks (`acquireProxyUrlFn/releaseProxyUrlFn`) to control which proxy urls (if any) each request should use.

## Static Properties

### UpstreamProxy.acquireProxyUrlFn {#acquire-proxy-url-fn}

Set this callback to be delegated control for creating a proxy for each url requested from the containing [Session](./session). You can choose to delegate each request to the same url for a session, or if you determine you need to change IP addresses, you can alter it per request.

#### **Type**: `Callback(request) => Promise<string>`

##### **Arguments**:

- request `object` The request needing a proxy url.
  - sessionId `string` The session id of this request.
  - navigationUrl `string` The url being requested.

##### **Returns** `Promise<string>`:
The url for the proxy service for this request.

### UpstreamProxy.releaseProxyUrlFn {#release-proxy-url-fn}

Set this callback to be notified when a proxy is no longer in use. This could be used to release any underlying resources and/or re-use a specific IP for another request.

#### **Type**: `Callback(request) => Promise`

##### **Arguments**:

- request `object` The request needing a proxy url.
  - sessionId `string` The session id of this request.
  - proxyUrl `string` The proxyUrl that was used for this request.

##### **Returns**: `Promise`:
Return a promise to indicate when you're done processing.
