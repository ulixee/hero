import * as Fs from 'fs';
import IBrowser from '../interfaces/IBrowser';
import DeviceCategory from '../interfaces/DeviceCategory';
import Browsers from '../lib/Browsers';
import { createBrowserId } from '../lib/BrowserUtils';
import extractReleaseDateAndDescription from '../lib/extractReleaseDateAndDescription';
import extractUserAgentMeta from '../lib/extractUserAgentMeta';
import { IRealUserAgentsData } from '../data';

export default class BrowserGenerator {
  public static async run(data: IRealUserAgentsData): Promise<void> {
    const byId: { [id: string]: IBrowser } = {};
    for (const { string: userAgentString } of data.userAgents) {
      const { name, version } = extractUserAgentMeta(userAgentString);
      const browserId = createBrowserId({ name, version });
      const marketshare = data.marketshare.byBrowserId[browserId] ?? 0;
      let releaseDate = 'unknown';
      let description = '';
      try {
        [releaseDate, description] = extractReleaseDateAndDescription(
          browserId,
          name,
          data.browserDescriptions,
          data.browserReleaseDates,
        );
      } catch (err) {
        console.warn(
          '%s. Update descriptions at "%s" and release dates at "%s"',
          err.message,
          `data/manual/browserDescriptions.json`,
          `data/manual/browserReleaseDates.json`,
        );
      }
      byId[browserId] = {
        id: browserId,
        name,
        marketshare,
        version,
        deviceCategory: DeviceCategory.desktop,
        releaseDate,
        description,
      };
    }
    const browserEnginesData = JSON.stringify(byId, null, 2);
    await Fs.promises.writeFile(Browsers.filePath, `${browserEnginesData}\n`);
  }
}
