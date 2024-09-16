export type Args = {
  deviceId?: string;
  groupId?: string
};
const typedArgs = args as Args;

if (
  navigator.mediaDevices &&
  navigator.mediaDevices.enumerateDevices &&
  navigator.mediaDevices.enumerateDevices.name !== 'bound reportBlock'
) {
  const videoDevice = {
    deviceId: typedArgs.deviceId,
    groupId: typedArgs.groupId,
    kind: 'videoinput',
    label: '',
  };
  replaceFunction(MediaDevices.prototype, 'enumerateDevices', (target, thisArg, argArray) => {
    return (ReflectCached.apply(target, thisArg, argArray) as Promise<any>).then(list => {
      if (list.find(x => x.kind === 'videoinput')) return list;
      list.push(videoDevice);
      return list;
    });
  });
}
