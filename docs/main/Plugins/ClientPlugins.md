# Client Plugins

> Client plugins extend Hero's frontend functionality at the Client interface level. YOu can use them to add extra properties and methods to the hero and/or tab instances.

## Creating Your Own Client Plugin

Adding a new plugin is as simple as creating a javascript class with the correct properties and methods, then registering it with `hero.use()`.

We recommend using the ClientPlugin base class in @ulixee/hero-plugin-utils, which handles setting most of the required properties and methods, everything except the static `id` property. Here's a simple plugin that adds a single hello() method to hero: 

```javascript
import { ClientPlugin } from '@ulixee/hero-plugin-utils';

export default class ClientHelloPlugin extends ClientPlugin {
  static readonly id = 'client-hello-plugin';
  // static type handled by ClientPlugin base

  onHero(hero) {
    hero.hello = (name) => console.log(`Hello ${name}`));
  } 
}
```

To register this ClientHelloPlugin in Hero, just pass it to `hero.use()`:

```javascript
import hero from '@ulixee/hero';
import ClientHelloPlugin from './ClientHelloPlugin';

hero.use(ClientHelloPlugin);
```

Your hero instance now supports the hello() method:

```javascript
hero.hello('World');
```

The rest of this page documents the various functionalities you can add to your class.

## Constructor

### new ClientPlugin<em>()</em>
A new instance of ClientPlugin is created for every hero instance. Use a constructor if you want to hook into the plugin's initialization. The constructor receives no arguments.

## Class Properties

### ClientPlugin.id *required*
This must be unique across all your Hero client plugins. We recommend using your plugin's npm package name.
#### **Type**: `string`

```javascript
import pkg from './package.json';

export default ClientHelloPlugin extends ClientPlugin {
  static readonly id = pkg.name;
  // static type handled by ClientPlugin base
}
```

### ClientPlugin.type *required*
This must always be set to `'ClientPlugin'`. It's how Hero differentiates between different plugin types. If your class extended the ClientPlugin base in @ulixee/utils then this is already set.
#### **Type**: `string` This must always be set to `'ClientPlugin'`.

### ClientPlugin.coreDependencyIds *optional*
Use this property to specify a list of core pluginIds that your ClientPlugin needs to operate. You should keep this list to the absolute minimum required.
#### **Type**: `string[]`

## Instance Method Hooks
The following methods are all optional. Use them when you want to hook into a specific Hero flow:

### onHero<em>(hero, sendToCore)</em> *optional*
This method is called every time a new Hero is initialized.
#### **Arguments**:
- hero `Hero`
- sendToCore: `(toPluginId: string, ...args: any[]) => Promise<any>`
#### **Returns** `void`

### onTab<em>(hero, tab, sendToCore)</em> *optional*
This method is called every time a new Tab is initialized.
#### **Arguments**:
- hero `Hero`
- tab `Tab`
- sendToCore: `(toPluginId: string, ...args: any[]) => Promise<any>`
#### **Returns** `void`

### onFrameEnvironment<em>(hero, frameEnvironment, sendToCore)</em> *optional*
This method is called every time a new FrameEnvironment is initialized.
#### **Arguments**:
- hero `Hero`
- tab `FrameEnvironment`
- sendToCore: `(toPluginId: string, ...args: any[]) => Promise<any>`
#### **Returns** `void`
