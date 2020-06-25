# WebsocketResource

> Websocket Resources are core websocket connections between a client and server.

The WebsocketResource class is returned from `window.waitForResource`. It contains all properties of a `Resource` in addition to an ability to subscribe to messages sent back and forth.

## Properties

### request

The Http Upgrade request used to create this Websocket.

#### **Returns** `ResourceRequest`

### response

A simulation of an HTTP response pieced together from the socket headers returned during a normal HTTP upgrade.

#### **Returns** `ResourceResponse`

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

### on<em>('message', callback: `WebsocketMessage` => any)</em>

Called on each websocket message returned.

`WebsocketMessages` contain:
- message `string | Buffer` - the contents of the message
- source `server | client` - where the message originated

#### **Returns** `Promise<void>`

### off<em>('message', callback: `WebsocketMessage` => any)</em>

Unsubscribe to messages.

#### **Returns** `Promise<void>`

### once<em>('message', callback: `WebsocketMessage` => any)</em>

Subscribe to a single websocket message

#### **Returns** `Promise<void>`

### addEventListener<em>('message', callback: `WebsocketMessage` => any)</em>

Alias for `on('message', callback')`

#### **Returns** `Promise<void>`

### removeEventListener<em>('message', callback: `WebsocketMessage` => any)</em>

Alias for `off('message', callback')`

#### **Returns** `Promise<void>`


### text<em>()</em>

Invalid call. Throws an Error. To subscribe to messages, see `on('message', callback)`

#### **Returns** `Promise<string>`

### json<em>()</em>

Invalid call. Throws an Error. To subscribe to messages, see `on('message', callback)`

#### **Returns** `Promise<json>`
