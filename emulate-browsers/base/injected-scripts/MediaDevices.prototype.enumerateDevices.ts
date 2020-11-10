if (
  navigator.mediaDevices &&
  navigator.mediaDevices.enumerateDevices &&
  navigator.mediaDevices.enumerateDevices.name !== 'bound reportBlock'
) {
  const videoDevice = {
    deviceId: args.deviceId,
    groupId: args.groupId,
    kind: 'videoinput',
    label: '',
  };
  proxyFunction(MediaDevices.prototype, 'enumerateDevices', (func, thisObj, ...args) => {
    return func.apply(thisObj, args).then(list => {
      if (list.find(x => x.kind === 'videoinput')) return list;
      list.push(videoDevice);
      return list;
    });
  });
}
