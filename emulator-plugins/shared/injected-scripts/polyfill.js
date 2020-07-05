for (const remove of args.removals) {
  try {
    const parts = getParentAndProperty(remove);
    delete parts.parent[parts.property];
  } catch (err) {
    console.log('ERROR deleting path ' + remove + '\n' + err.toString());
  }
}

for (const addition of args.additions) {
  try {
    if (addition.propertyName === 'getVideoPlaybackQuality') {
      addition.property['_value()'] = function() {
        return Promise.resolve([]);
      };
    }

    addDescriptorAfterProperty(
      addition.path,
      addition.prevProperty,
      addition.propertyName,
      buildDescriptor(addition.property),
    );
  } catch (err) {
    console.log(
      'ERROR adding order polyfill ' +
        addition.path +
        '.' +
        addition.propertyName +
        '\n' +
        err.stack,
    );
  }
}

for (const change of args.changes) {
  try {
    if (change.propertyName === '_function') {
      const func = getObjectAtPath(change.path);
      definedFuncs.set(func, change.property);
    }
    if (
      change.propertyName === '_setToStringToString' ||
      change.propertyName === '_getToStringToString'
    ) {
      nativeToStringFunctionString = change.property;
      continue;
    }

    const parts = getParentAndProperty(change.path);
    const property = parts.property;
    const parent = parts.parent;
    const descriptor = Object.getOwnPropertyDescriptor(parent, property);

    if (change.propertyName === '_value') {
      descriptor.value = change.property;
      Object.defineProperty(parent, property, descriptor);
    }

    if (change.propertyName === '_get') {
      definedFuncs.set(descriptor.get, change.property);
    }

    if (change.propertyName === '_set') {
      definedFuncs.set(descriptor.set, change.property);
    }
  } catch (err) {
    console.log(
      'ERROR changing prop ' + change.path + '.' + change.propertyName + '\n' + err.stack,
    );
  }
}

for (const { propertyName, prevProperty, throughProperty, path } of args.order) {
  try {
    if (!path.includes('.prototype')) {
      reorderOnWindow(path);
      continue;
    }
    reorderDescriptor(path, propertyName, prevProperty, throughProperty);
  } catch (err) {
    console.log(
      'ERROR adding order polyfill ' + path + '->' + propertyName + '\n' + err.toString(),
    );
  }
}

function reorderOnWindow(objectPath) {
  const getOwnPropertyDescriptorsToString = Object.getOwnPropertyDescriptors.toString();
  Object.getOwnPropertyDescriptors = new Proxy(Object.getOwnPropertyDescriptors, {
    apply(target, thisArg, argArray) {
      const descriptors = Reflect.apply(...arguments);
      const objectAtPath = getObjectAtPath(objectPath);
      if (thisArg === objectAtPath || (argArray && argArray[0] === objectAtPath)) {
        const keys = Object.keys(descriptors);
        adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
        const finalDescriptors = {};
        for (const key of keys) {
          finalDescriptors[key] = descriptors[key];
        }
        return finalDescriptors;
      }
      return descriptors;
    },
  });
  definedFuncs.set(Object.getOwnPropertyDescriptors, getOwnPropertyDescriptorsToString);

  const getOwnPropertyNamesToString = Object.getOwnPropertyNames.toString();
  Object.getOwnPropertyNames = new Proxy(Object.getOwnPropertyNames, {
    apply(target, thisArg, argArray) {
      const objectAtPath = getObjectAtPath(objectPath);
      const keys = Reflect.apply(...arguments);
      if (thisArg === objectAtPath || (argArray && argArray[0] === objectAtPath)) {
        adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
      }
      return keys;
    },
  });
  definedFuncs.set(Object.getOwnPropertyNames, getOwnPropertyNamesToString);

  const keysToString = Object.keys.toString();
  Object.keys = new Proxy(Object.keys, {
    apply(target, thisArg, argArray) {
      const keys = Reflect.apply(...arguments);
      const objectAtPath = getObjectAtPath(objectPath);
      if (thisArg === objectAtPath || (argArray && argArray[0] === objectAtPath)) {
        adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
      }
      return keys;
    },
  });
  definedFuncs.set(Object.keys, keysToString);
}
