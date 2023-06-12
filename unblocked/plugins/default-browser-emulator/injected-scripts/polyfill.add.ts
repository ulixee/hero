for (const itemToAdd of args.itemsToAdd || []) {
  try {
    if (itemToAdd.propertyName === 'getVideoPlaybackQuality') {
      itemToAdd.property['_$$value()'] = function () {
        return Promise.resolve([]);
      };
    }

    addDescriptorAfterProperty(
      itemToAdd.path,
      itemToAdd.prevProperty,
      itemToAdd.propertyName,
      buildDescriptor(
        itemToAdd.property,
        `${itemToAdd.path}.${itemToAdd.propertyName}`.replace('window.', ''),
      ),
    );
  } catch (err) {
    console.log(`ERROR adding polyfill ${itemToAdd.path}.${itemToAdd.propertyName}\n${err.stack}`);
  }
}
