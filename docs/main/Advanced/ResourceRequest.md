# ResourceRequest

> Resource requests are the raw underlying http request details made to access a resource.

Instances of this class are associated with a resource returned from `window.waitForResource` or from the initial window document load.

## Properties

### headers

Retrieve the actual headers sent to the server (order and casing is preserved)

#### **Returns** `Promise<{ [name: string]: string }>`

### url

The requested url.

#### **Returns** `Promise<string>`

### timestamp

ISO formatted date string.

#### **Returns** `Promise<string>`

### method

Http method. Possible values: `GET, POST, PUT, DELETE`.

#### **Returns** `Promise<string>`

### postData

Data sent to perform this request (if http post)

#### **Returns** `Promise<string>`
