# Resource

> Resources are all network assets loaded to render a page, including CSS, Javascript, Fonts, Web Sockets, XHR/Fetch Requests, and more.

The Resource class is returned from `window.waitForResource` calls. It is used to dynamically load portions of a Resource on demand.

If an obtained Resource is a Websocket, a `WebsocketResource` is returned.

## Properties

### request

Retrieve the network request used to retrieve this resource.

#### **Returns** `ResourceRequest`

### response

Retrieve the network request used to retrieve this resource.

#### **Returns** `ResourceResponse`

### url

The requested url

#### **Returns** `string`

### type

The type of resource. Possible values are:
`Document, Redirect, Websocket, Ico, Preflight, Script, Stylesheet, Xhr, Fetch, Image, Media, Font, Text Track, Event Source, Manifest, Signed Exchange, Ping, CSP Violation Report, Other`

#### **Returns** `ResourceType`

### isRedirect

Was this request redirected

#### **Returns** `boolean`

### data

Load the underlying buffer returned by this network response.

#### **Returns** `Promise<Buffer>`

## Methods

### text<em>()</em>

Convert the returned resource body to a string.

#### **Returns** `Promise<string>`

### json<em>()</em>

Convert the returned resource body into json.

#### **Returns** `Promise<json>`
