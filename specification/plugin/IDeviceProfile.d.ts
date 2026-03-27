import IViewport from '../agent/browser/IViewport';
export default interface IDeviceProfile {
    deviceMemory?: number;
    rtt?: number;
    hardwareConcurrency?: number;
    deviceStorageTib?: number;
    maxHeapSize?: number;
    videoDevice?: {
        deviceId: string;
        groupId: string;
    };
    viewport?: IViewport;
    webGlParameters?: Record<string, string | number | boolean>;
}
