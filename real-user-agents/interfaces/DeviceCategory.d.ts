declare enum DeviceCategory {
    desktop = "desktop"
}
export default DeviceCategory;
export type IDeviceCategory = keyof typeof DeviceCategory;
