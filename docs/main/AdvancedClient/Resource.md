# Resource

> Resources are all network assets loaded to render a page, including CSS, Javascript, Fonts, Web Sockets, XHR/Fetch Requests, and more.

The Resource class is returned from [`tab.waitForResource`](/docs/hero/basic-client/tab#wait-for-resource) calls. It is used to dynamically load portions of a Resource on demand.

If an obtained Resource is a Websocket, a `WebsocketResource` is returned.

## Properties

### request

Retrieve the network request used to retrieve this resource.

#### **Returns** [`ResourceRequest`](/docs/hero/advanced-client/resource-request)

### response

Retrieve the network request used to retrieve this resource.

#### **Returns** [`ResourceResponse`](/docs/hero/advanced-client/resource-response)

### url

The requested url

#### **Returns** `string`

### documentUrl

The document (if applicable) that requested this resource.

#### **Returns** `string`

### type

The type of resource. Possible values are:
`Document, Redirect, Websocket, Ico, Preflight, Script, Stylesheet, XHR, Fetch, Image, Media, Font, TextTrack, EventSource, Manifest, SignedExchange, Ping, CSPViolationReport, Other`

#### **Returns** `ResourceType`

### isRedirect

Was this request redirected

#### **Returns** `boolean`

### buffer

Load the underlying buffer returned by this network response.

#### **Returns** `Promise<Buffer>`

## Methods

### text

Convert the returned resource body to a string.

#### **Returns** `Promise<string>`

### json

Convert the returned resource body into json.

#### **Returns** `Promise<json>`
