import IViewport from '@secret-agent/core-interfaces/IViewport';
import { pickRandom } from '@secret-agent/commons/utils';
import resolutionData from '../data/resolution.json';

const resolutionsDistribution: [number, number][] = [];
for (const resolution of resolutionData.sizes) {
  const [width, height] = resolution.resolution as [number, number];
  // filter out vertically oriented and infrequently used
  if (width < height || resolution.percent <= 5) continue;
  for (let i = 0; i < resolution.percent * 10; i += 1) {
    resolutionsDistribution.push([width, height]);
  }
}

export default class Viewport {
  static getRandomResolution() {
    const resolution = pickRandom(resolutionsDistribution);
    return {
      width: resolution[0],
      height: resolution[1],
    };
  }

  static getRandom() {
    const resolution = this.getRandomResolution();
    const positionX = Math.floor(Math.random() * 200);
    const positionY = Math.floor(Math.random() * 150);

    const widthPercent = 30 * Math.random() + 70;
    const heightPercent = 20 * Math.random() + 80;

    const maxHeight = resolution.height - positionY;
    const maxWidth = resolution.width - positionX;

    const width = Math.floor((widthPercent / 100) * maxWidth);
    const height = Math.floor((heightPercent / 100) * maxHeight);

    return {
      positionX,
      positionY,
      screenWidth: resolution.width,
      screenHeight: resolution.height,
      width,
      height,
      deviceScaleFactor: 1,
    } as IViewport;
  }
}
