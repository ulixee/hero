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
        height: 150,
        y: VIEW_Y_OFFSET + 100,
      },
      calcBounds(bounds) {
        return {
          width,
          height: 150,
          x: bounds.width / 2 - width / 2,
          y: bounds.y + bounds.height / 2 - 150,
        };
      },
      devtools: false,
    });
  }
}
