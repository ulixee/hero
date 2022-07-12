# WebsocketResource

> Websocket Resources are core websocket connections between a client and server.

Instances of this class are associated with a resource returned from [`tab.waitForResource`](/docs/hero/basic-client/tab##wait-for-resource), listening for resources [`tab.on('resource')`](/docs/hero/basic-client/tab#resource-event) or from the initial window document load. It contains all properties of a `Resource` in addition to an ability to subscribe to messages sent back and forth.

## Properties

### request

The Http Upgrade request used to create this Websocket.

#### **Returns** [`ResourceRequest`](/docs/hero/advanced-client/resource-request)

### response

A simulation of an HTTP response pieced together from the socket headers returned during a normal HTTP upgrade.

#### **Returns** [`ResourceResponse`](/docs/hero/advanced-client/resource-response)

### url

The Http Upgrade url.

#### **Returns** `string`

### type

The type of resource.

#### **Returns** `ResourceType=WebSocket`

### isRedirect

Was this request redirected

#### **Returns** `boolean`

### data

Invalid call. Throws an Error. To subscribe to messages, see `on('message', callback)`

#### **Returns** `Promise<Buffer>`

## Methods

### on<em>('message', callback: [`WebsocketMessage`](#websocket-message) => any)</em> {#on}

Called on each websocket message returned.

#### `WebsocketMessage` contain: {#websocket-message}
- message `string | Buffer` - the contents of the message
- source `server | client` - where the message originated

#### **Returns** `Promise<void>`

### off<em>('message', callback: [`WebsocketMessage`](#websocket-message) => any)</em> {#off}

Unsubscribe to messages.

#### **Returns** `Promise<void>`

### once<em>('message', callback: [`WebsocketMessage`](#websocket-message) => any)</em> {#once}

Subscribe to a single websocket message

#### **Returns** `Promise<void>`

### addEventListener<em>('message', callback: [`WebsocketMessage`](#websocket-message) => any)</em> {#add-event-listener}

Alias for `on('message', callback')`

#### **Returns** `Promise<void>`

### removeEventListener<em>('message', callback: [`WebsocketMessage`](#websocket-message) =>  any)</em> {#remove-event-listener}

Alias for `off('message', callback')`

#### **Returns** `Promise<void>`


### text<em>()</em> {#text}

Invalid call. Throws an Error. To subscribe to messages, see `on('message', callback)`

#### **Returns** `Promise<string>`

### json<em>()</em> {#json}

Invalid call. Throws an Error. To subscribe to messages, see `on('message', callback)`

#### **Returns** `Promise<json>`
