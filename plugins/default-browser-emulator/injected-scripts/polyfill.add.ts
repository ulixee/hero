export type Args = {
  itemsToAdd: any[];
};
const typedArgs = args as Args;

for (const itemToAdd of typedArgs.itemsToAdd) {
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
    let log = `ERROR adding polyfill ${itemToAdd.path}.${itemToAdd.propertyName}`;
    if (err instanceof Error) {
      log += `\n${err.stack}`;
    }
    console.error(log);
  }
}

PathToInstanceTracker.updateAllReferences();
