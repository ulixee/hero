# Worker

A worker can be a Web Worker, Service Worker or Shared Worker.

## Instances

Workers that are attached to a page will be automatically created.

## Properties

- devtoolsSession [`DevtoolsSession`](./DevtoolsSession.md) A Devtools Session tied to this method.

## Methods

### evaluate<T>(expression, isolatedContext): Promise<T>

Evaluate a Javascript expression/script in this Worker environment.

#### **Arguments**:

- expression `string`. A Javascript expression to evaluate. Multiple lines need to be wrapped in a containing, self-calling function.
- isolatedContext `boolean`. Whether to isolate this expression from the default worker memory space. Default `false`.

## Hooks

- onNewWorker(worker) - called before Worker is resumed
