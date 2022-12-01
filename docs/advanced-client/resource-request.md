# ResourceRequest

> Resource requests are the raw underlying http request details made to access a resource.

Instances of this class are associated with a resource returned from [`tab.waitForResource`](../advanced-client/tab.md##wait-for-resource), listening for resources [`tab.on('resource')`](../advanced-client/tab.md#resource-event) or from the initial window document load.

## Properties

### headers

Retrieve the actual headers sent to the server (order and casing is preserved)

#### **Returns** `{ [name: string]: string }`

### url

The requested url.

#### **Returns** `string`

### timestamp

ISO formatted date string.

#### **Returns** `string`

### method

Http method. Possible values: `GET, POST, PUT, DELETE`.

#### **Returns** `string`

### postData

Data sent to perform this request (if http post)

#### **Returns** `Promise<Buffer>`
