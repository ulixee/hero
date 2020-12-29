for (const addition of args.additions || []) {
  try {
    if (addition.propertyName === 'getVideoPlaybackQuality') {
      addition.property['_$$value()'] = function() {
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
    console.log(`ERROR adding polyfill ${addition.path}.${addition.propertyName}\n${err.stack}`);
  }
}
