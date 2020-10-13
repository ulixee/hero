import BaseOverlay from '~backend/overlays/BaseOverlay';
import { VIEW_Y_OFFSET } from '~shared/constants/design';

const width = 350;
export default class MessageOverlay extends BaseOverlay {
  public static width = width;
  constructor() {
    super({
      name: 'message-overlay',
      bounds: {
        width,
        height: 200,
        y: VIEW_Y_OFFSET + 100,
      },
      calcBounds(bounds) {
        const height = Math.max(this.lastHeight, 200);
        return {
          width,
          height: height + 20,
          x: bounds.width / 2 - width / 2,
          y: bounds.y + bounds.height / 2 - height,
        };
      },
    });
  }
}
