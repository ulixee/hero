import IDeviceProfile from '@secret-agent/interfaces/IDeviceProfile';
import { randomBytes } from 'crypto';

export default function configureDeviceProfile(deviceProfile: IDeviceProfile): void {
  deviceProfile.deviceMemory ??= Math.ceil(Math.random() * 4) * 2;
  deviceProfile.videoDevice ??= {
    deviceId: randomBytes(32).toString('hex'),
    groupId: randomBytes(32).toString('hex'),
  };
  deviceProfile.webGlParameters ??= {
    // UNMASKED_VENDOR_WEBGL
    37445: 'Intel Inc.',
    // UNMASKED_RENDERER_WEBGL
    37446: 'Intel Iris OpenGL Engine',
  };
}
