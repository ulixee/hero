for (const itemToRemove of args.itemsToRemove || []) {
  try {
    const parent = getObjectAtPath(itemToRemove.path);
    delete parent[itemToRemove.propertyName];
  } catch (err) {
    console.log(`ERROR deleting path ${itemToRemove.path}.${itemToRemove.propertyName}\n${err.toString()}`);
  }
}
