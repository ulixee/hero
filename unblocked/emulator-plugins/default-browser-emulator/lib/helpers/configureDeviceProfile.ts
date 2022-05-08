import IDeviceProfile from '@unblocked/emulator-spec/browser/IDeviceProfile';
import { pickRandom } from '@ulixee/commons/lib/utils';
import { randomBytes } from 'crypto';

export default function configureDeviceProfile(deviceProfile: IDeviceProfile): void {
  deviceProfile.deviceMemory ??= pickRandom([1,2,4,8]);
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
