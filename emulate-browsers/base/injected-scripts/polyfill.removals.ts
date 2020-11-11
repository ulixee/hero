for (const remove of args.removals || []) {
  try {
    const parts = getParentAndProperty(remove);
    delete parts.parent[parts.property];
  } catch (err) {
    console.log(`ERROR deleting path ${remove}\n${err.toString()}`);
  }
}
