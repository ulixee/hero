for (const { propertyName, prevProperty, throughProperty, path } of args.itemsToReorder || []) {
  try {
    if (!path.includes('.prototype')) {
      reorderNonConfigurableDescriptors(path, propertyName, prevProperty, throughProperty);
      continue;
    }
    reorderDescriptor(path, propertyName, prevProperty, throughProperty);
  } catch (err) {
    console.log(`ERROR adding order polyfill ${path}->${propertyName}\n${err.toString()}`);
  }
}
