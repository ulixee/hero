import { safeOverwriteFile } from '@ulixee/commons/lib/fileUtils';
import DeviceCategory from '../interfaces/DeviceCategory';
import OperatingSystems from '../lib/OperatingSystems';
import { getOsNameFromId, getOsVersionFromOsId } from '../lib/OsUtils';
import extractReleaseDateAndDescription from '../lib/extractReleaseDateAndDescription';
import { IRealUserAgentsData } from '../data';
import IOperatingSystem from '../interfaces/IOperatingSystem';

export default class OsGenerator {
  public static async run(data: IRealUserAgentsData): Promise<void> {
    const byId: { [id: string]: IOperatingSystem } = {};
    for (const userAgent of data.userAgents) {
      // can't rely on user agent on mac after 10_15_7 (https://chromestatus.com/feature/5452592194781184)
      const id = userAgent.osId;
      const name = getOsNameFromId(id);
      const version = getOsVersionFromOsId(id);
      const marketshare = data.marketshare.byOsId[id] ?? 0;
      if (byId[id]) continue;

      let releaseDate = 'unknown';
      let description = '';
      try {
        [releaseDate, description] = extractReleaseDateAndDescription(
          id,
          name,
          data.osDescriptions,
          data.osReleaseDates,
        );
      } catch (err) {
        console.warn(
          '%s. Update descriptions at "%s" and release dates at "%s"',
          err.message,
          `data/manual/osDescriptions.json`,
          `data/manual/osReleaseDates.json`,
        );
      }

      byId[id] = {
        id,
        name,
        marketshare,
        deviceCategory: DeviceCategory.desktop,
        version,
        releaseDate,
        description,
      };
    }
    await safeOverwriteFile(OperatingSystems.filePath, `${JSON.stringify(byId, null, 2)}\n`);
  }
}
