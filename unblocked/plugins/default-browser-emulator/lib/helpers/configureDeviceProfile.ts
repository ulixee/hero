import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';
import { pickRandom } from '@ulixee/commons/lib/utils';
import { randomBytes } from 'crypto';

export default function configureDeviceProfile(deviceProfile: IDeviceProfile): void {
  deviceProfile.deviceMemory ??= pickRandom([2, 4, 8]);
  deviceProfile.videoDevice ??= {
    deviceId: randomBytes(32).toString('hex'),
    groupId: randomBytes(32).toString('hex'),
  };

  // values observed in real chrome instances
  deviceProfile.maxHeapSize = 4294705152;
  if (deviceProfile.deviceMemory === 4) {
    deviceProfile.maxHeapSize = 2172649472;
  } else if (deviceProfile.deviceMemory === 2) {
    deviceProfile.maxHeapSize = 1620000000;
  }

  deviceProfile.deviceStorageTib ??= pickRandom([0.5, 1, 2, 4, 8, 16]);

  deviceProfile.webGlParameters ??= {
    // UNMASKED_VENDOR_WEBGL
    37445: 'Intel Inc.',
    // UNMASKED_RENDERER_WEBGL
    37446: 'Intel Iris OpenGL Engine',
  };
}
