for (const change of args.changes || []) {
  try {
    if (change.propertyName === '_$function') {
      const func = getObjectAtPath(change.path);
      overriddenFns.set(func, change.property);
    }
    if (
      change.propertyName === '_$setToStringToString' ||
      change.propertyName === '_$getToStringToString'
    ) {
      nativeToStringFunctionString = change.property;
      continue;
    }

    const parts = getParentAndProperty(change.path);
    const property = parts.property;
    const parent = parts.parent;
    const descriptorInHierarchy = getDescriptorInHierarchy(parent, property);
    if (!descriptorInHierarchy) {
      console.warn('Descriptor not found for polyfill', change);
      continue;
    }
    const { descriptor } = descriptorInHierarchy;

    if (change.propertyName === '_$value') {
      if (descriptor.get) {
        descriptor.get = proxyGetter(parent, property, () => change.property);
      } else {
        descriptor.value = change.property;
        Object.defineProperty(parent, property, descriptor);
      }
    } else if (change.propertyName === '_$get') {
      overriddenFns.set(descriptor.get, change.property);
    } else if (change.propertyName === '_$set') {
      overriddenFns.set(descriptor.set, change.property);
    }
  } catch (err) {
    console.log(`WARN: error changing prop ${change.path}.${change.propertyName}\n${err.stack}`);
  }
}
