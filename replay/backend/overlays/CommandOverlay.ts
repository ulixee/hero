import BaseOverlay from '~backend/overlays/BaseOverlay';
import IRectangle from '~shared/interfaces/IRectangle';

const width = 416;
const middle = width / 2;
export default class CommandOverlay extends BaseOverlay {
  public static width = width;
  constructor() {
    super({
      name: 'command-overlay',
      calcBounds(bounds: IRectangle) {
        let x = bounds.x - middle;
        if (x + width > bounds.right + 50) {
          x = bounds.right + 50 - width;
        }
        if (bounds.left !== undefined) {
          if (x < bounds.left - 50) {
            x = bounds.left - 50;
          }
        }

        return {
          width,
          height: 200,
          x,
          y: bounds.y + bounds.height,
        };
      },
      devtools: false,
      onWindowBoundsUpdate: () => {
        this.hide();
      },
    });
  }
}
