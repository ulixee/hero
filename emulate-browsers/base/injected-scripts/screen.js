const props = {};
if (!window.outerWidth) {
  props.outerWidth = {
    get: () => window.innerWidth,
  };
}
if (args.windowFrame && !window.outerHeight) {
  props.outerHeight = {
    get: () => window.innerHeight + args.windowFrame,
  };
}

if (Object.keys(props).length) {
  proxyDescriptors(window, props);
}
