export default interface IDeviceProfile {
  deviceMemory?: number;
  maxHeapSize?: number;
  videoDevice?: {
    deviceId: string;
    groupId: string;
  };
  webGlParameters?: Record<string, string | number | boolean>;
}
