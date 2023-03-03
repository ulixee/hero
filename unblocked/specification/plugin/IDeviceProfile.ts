export default interface IDeviceProfile {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  deviceStorageTib?: number;
  maxHeapSize?: number;
  videoDevice?: {
    deviceId: string;
    groupId: string;
  };
  webGlParameters?: Record<string, string | number | boolean>;
}
