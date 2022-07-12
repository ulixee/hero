# ResourceResponse

> Resource requests are the raw underlying http request details made to access a resource.

Instances of this class are associated with a resource returned from [`tab.waitForResource`](/docs/hero/basic-client/tab##wait-for-resource), listening for resources [`tab.on('resource')`](/docs/hero/basic-client/tab#resource-event) or from the initial window document load.

## Properties

### browserServedFromCache

Will have a value if http response was served from a browser cache.

#### **Returns** `null | 'service-worker' | 'disk' | 'prefetch' | 'memory'`

### browserLoadFailure

Will have a value if an http error occurred loading this request.

#### **Returns** `string | null`

### headers

Retrieve the actual headers returned to the client (order and casing is preserved)

#### **Returns** `{ [name: string]: string }`

### url

The response url (if redirected).

#### **Returns** `string`

### timestamp

ISO formatted date string.

#### **Returns** `string`

### remoteAddress

IPv4/6 and port of remote socket. `192.168.172.2:5001`

#### **Returns** `string`

### statusCode

Http response status code.

NOTE: this value might be null if no HTTP response occurred, or an error occurred.

#### **Returns** `number`

### statusText

Http response status message.

#### **Returns** `string`

### buffer

Load the underlying buffer returned by this network response.

#### **Returns** `Promise<Buffer>`

## Methods

### text<em>()</em>

Convert the returned resource body to a string.

#### **Returns** `Promise<string>`

### json<em>()</em>

Convert the returned resource body into json.

#### **Returns** `Promise<json>`
