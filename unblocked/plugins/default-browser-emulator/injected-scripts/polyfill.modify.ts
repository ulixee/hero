for (const itemToModify of args.itemsToModify || []) {
  try {
    if (itemToModify.propertyName === '_$function') {
      const func = getObjectAtPath(itemToModify.path);
      overriddenFns.set(func, itemToModify.property);
    }
    if (
      itemToModify.propertyName === '_$setToStringToString' ||
      itemToModify.propertyName === '_$getToStringToString'
    ) {
      nativeToStringFunctionString = itemToModify.property;
      continue;
    }

    // Currently not supported
    if (itemToModify.path.includes('new()')) {
      continue;
    }

    const parts = getParentAndProperty(itemToModify.path);
    const property = parts.property;
    const parent = parts.parent;
    const descriptorInHierarchy = getDescriptorInHierarchy(parent, property);
    if (!descriptorInHierarchy) {
      console.warn('Descriptor not found for polyfill', itemToModify);
      continue;
    }
    const { descriptor } = descriptorInHierarchy;

    if (itemToModify.propertyName === '_$value') {
      if (descriptor.get) {
        descriptor.get = proxyGetter(parent, property, () => itemToModify.property);
      } else {
        descriptor.value = itemToModify.property;
        Object.defineProperty(parent, property, descriptor);
      }
    } else if (itemToModify.propertyName === '_$get') {
      overriddenFns.set(descriptor.get, itemToModify.property);
    } else if (itemToModify.propertyName === '_$set') {
      overriddenFns.set(descriptor.set, itemToModify.property);
    } else if (itemToModify.propertyName.startsWith('_$otherInvocation')) {
      // TODO why is this needed, Im guessing since this is one big dump?
      const ReflectCachedHere = ReflectCached;
      const invocationReturnOrThrowHere = invocationReturnOrThrow;
      const OtherInvocationsTrackerHere = OtherInvocationsTracker;
      // Create single proxy on original prototype so 'this' rebinding is possible.
      if (!OtherInvocationsTracker.basePaths.has(itemToModify.path)) {
        proxyFunction(parent, property, (target, thisArg, argArray) => {
          const otherInvocation = OtherInvocationsTrackerHere.getOtherInvocation(
            itemToModify.path,
            thisArg,
          );

          return otherInvocation !== undefined
            ? invocationReturnOrThrowHere(otherInvocation.invocation, otherInvocation.isAsync)
            : ReflectCachedHere.apply(target, thisArg, argArray);
        });
      }

      const otherKey = itemToModify.propertyName;
      OtherInvocationsTracker.addOtherInvocation(
        itemToModify.path,
        otherKey,
        itemToModify.property,
      );
    }
  } catch (err) {
    console.log(
      `WARN: error changing prop ${itemToModify.path}.${itemToModify.propertyName}\n${err.stack}`,
    );
  }
}

PathToInstanceTracker.updateAllReferences();
