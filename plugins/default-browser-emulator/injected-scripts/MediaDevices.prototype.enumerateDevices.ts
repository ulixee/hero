import type { ScriptInput } from './_utils';

export type Args = {
  deviceId?: string;
  groupId?: string;
};

export function main({ args, utils: { replaceFunction, ReflectCached } }: ScriptInput<Args>) {
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
    replaceFunction(MediaDevices.prototype, 'enumerateDevices', (target, thisArg, argArray) => {
      return (ReflectCached.apply(target, thisArg, argArray) as Promise<any>).then(list => {
        if (list.find(x => x.kind === 'videoinput')) return list;
        list.push(videoDevice);
        return list;
      });
    });
  }
}
