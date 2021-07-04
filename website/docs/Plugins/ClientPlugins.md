# Client Plugins

> Client plugins extend SecretAgent's frontend functionality at the Client interface level. YOu can use them to add extra properties and methods to the agent and/or tab instances.

## Creating Your Own Client Plugin

Adding a new plugin is as simple as creating a javascript class with the correct properties and methods, then registering it with `agent.use()`.

Our recommendation is to use the ClientPlugin base class provided by @secret-agent/plugin-utils, which handles setting most of the required properties and methods, all except the static `id` property. Here's a simple plugin that adds a single hello() method to agent: 

```javascript
import { ClientPlugin } from '@secret-agent/plugin-utils';

export default class ClientHelloPlugin extends ClientPlugin {
  static readonly id = 'client-hello-plugin';
  // static type handled by ClientPlugin base

  onAgent(agent) {
    agent.hello = (name) => console.log(`Hello ${name}`));
  } 
}
```

To register this ClientHelloPlugin in SecretAgent, just pass it to `agent.use()`:

```javascript
import agent from 'secret-agent';
import ClientHelloPlugin from './ClientHelloPlugin';

agent.use(ClientHelloPlugin);
```

Your agent instance now supports the hello() method:

```javascript
agent.hello('World');
```

The rest of this page documents the various functionalities you can add to your class.

## Constructor

### new ClientPlugin<em>()</em>
A new instance of ClientPlugin is created for every agent instance. Use a constructor if you want to hook into the plugin's initialization. The constructor receives no arguments.

## Class Properties

### ClientPlugin.id *required*
This must be unique across all your SecretAgent client plugins. We recommend setting this to your plugin's npm package name.
#### **Type**: `string`

```javascript
import pkg from './package.json';

export default ClientHelloPlugin extends ClientPlugin {
  static readonly id = pkg.name;
  // static type handled by ClientPlugin base
}
```

### ClientPlugin.type *required*
This must always be set to `'ClientPlugin'`. It's how SecretAgent differentiates between different plugin types. If your class extended the ClientPlugin base in @secret-agent/utils then this is already set.
#### **Type**: `string` This must always be set to `'ClientPlugin'`.

### ClientPlugin.coreDependencyIds *optional*
Use this property to specify a list of core pluginIds that your ClientPlugin needs to operate. You should keep this list to the absolute minimum required.
#### **Type**: `string[]`

## Instance Method Hooks
The following methods are all optional. Use them when you want to hook into a specific SecretAgent flow:

### onAgent<em>(agent, sendToCore)</em> *optional*
This method is called every time a new Agent in initialized.
#### **Arguments**:
- agent `Agent`
- sendToCore: `(toPluginId: string, ...args: any[]) => Promise<any>`
#### **Returns** `void`

### onTab<em>(agent, tab, sendToCore)</em> *optional*
This method is called every time a new Tab in initialized.
#### **Arguments**:
- agent `Agent`
- tab `Tab`
- sendToCore: `(toPluginId: string, ...args: any[]) => Promise<any>`
#### **Returns** `void`
