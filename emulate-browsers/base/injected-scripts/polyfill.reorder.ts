for (const { propertyName, prevProperty, throughProperty, path } of args.order || []) {
  try {
    if (!path.includes('.prototype')) {
      reorderOnWindow(path, propertyName, prevProperty, throughProperty);
      continue;
    }
    reorderDescriptor(path, propertyName, prevProperty, throughProperty);
  } catch (err) {
    console.log(`ERROR adding order polyfill ${path}->${propertyName}\n${err.toString()}`);
  }
}

function reorderOnWindow(objectPath, propertyName, prevProperty, throughProperty) {
  const getOwnPropertyDescriptorsToString = Object.getOwnPropertyDescriptors.toString();
  Object.getOwnPropertyDescriptors = new Proxy(Object.getOwnPropertyDescriptors, {
    apply(target, thisArg, argArray) {
      const descriptors = ReflectCached.apply(...arguments);
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
  overriddenFns.set(Object.getOwnPropertyDescriptors, getOwnPropertyDescriptorsToString);

  const getOwnPropertyNamesToString = Object.getOwnPropertyNames.toString();
  Object.getOwnPropertyNames = new Proxy(Object.getOwnPropertyNames, {
    apply(target, thisArg, argArray) {
      const objectAtPath = getObjectAtPath(objectPath);
      const keys = ReflectCached.apply(...arguments);
      if (thisArg === objectAtPath || (argArray && argArray[0] === objectAtPath)) {
        adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
      }
      return keys;
    },
  });
  overriddenFns.set(Object.getOwnPropertyNames, getOwnPropertyNamesToString);

  const keysToString = Object.keys.toString();
  Object.keys = new Proxy(Object.keys, {
    apply(target, thisArg, argArray) {
      const keys = ReflectCached.apply(...arguments);
      const objectAtPath = getObjectAtPath(objectPath);
      if (thisArg === objectAtPath || (argArray && argArray[0] === objectAtPath)) {
        adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
      }
      return keys;
    },
  });
  overriddenFns.set(Object.keys, keysToString);
}

function reorderDescriptor(path, propertyName, prevProperty, throughProperty) {
  const owner = getObjectAtPath(path);

  const descriptor = Object.getOwnPropertyDescriptor(owner, propertyName);
  if (!descriptor) {
    console.log(`Can't redefine a non-existent property descriptor: ${path} -> ${propertyName}`);
    return;
  }
  const prevDescriptor = Object.getOwnPropertyDescriptor(owner, prevProperty);
  if (!prevDescriptor) {
    console.log(
      `Can't redefine a non-existent prev property descriptor: ${path} -> ${propertyName}, prev =${prevProperty}`,
    );
    return;
  }

  const descriptors = Object.getOwnPropertyDescriptors(owner);
  const keys = Object.keys(owner);
  adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);

  for (const key of keys) {
    const keyDescriptor = descriptors[key];
    delete owner[key];
    Object.defineProperty(owner, key, keyDescriptor);
  }
}

function adjustKeyOrder(keys, propertyName, prevProperty, throughProperty) {
  const currentIndex = keys.indexOf(propertyName);
  const throughPropIndex = keys.indexOf(throughProperty) - currentIndex + 1;
  const props = keys.splice(currentIndex, throughPropIndex);
  keys.splice(keys.indexOf(prevProperty) + 1, 0, ...props);
}
