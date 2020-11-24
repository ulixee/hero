for (const change of args.changes || []) {
  try {
    if (change.propertyName === '_function') {
      const func = getObjectAtPath(change.path);
      overriddenFns.set(func, change.property);
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
    const descriptorInHierarchy = getDescriptorInHierarchy(parent, property);
    if (!descriptorInHierarchy) {
      console.warn('Descriptor not found for polyfill', change);
      continue;
    }
    const { descriptor } = descriptorInHierarchy;

    if (change.propertyName === '_value') {
      if (descriptor.get) {
        descriptor.get = proxyGetter(parent, property, () => change.property);
      } else {
        descriptor.value = change.property;
        Object.defineProperty(parent, property, descriptor);
      }
    }

    if (change.propertyName === '_get') {
      overriddenFns.set(descriptor.get, change.property);
    }

    if (change.propertyName === '_set') {
      overriddenFns.set(descriptor.set, change.property);
    }
  } catch (err) {
    console.log(`WARN: error changing prop ${change.path}.${change.propertyName}\n${err.stack}`);
  }
}
