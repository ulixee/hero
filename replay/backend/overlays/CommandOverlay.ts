import BaseOverlay from '~backend/overlays/BaseOverlay';
import IRectangle from '~shared/interfaces/IRectangle';

const width = 416;
const middle = width / 2;
export default class CommandOverlay extends BaseOverlay {
  public static width = width;
  constructor() {
    super({
      name: 'command-overlay',
      maxHeight: 250,
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

        bounds.height = Math.max(this.lastHeight, 100) + 28;
        bounds.y -= bounds.height;

        return {
          width,
          height: bounds.height,
          x,
          y: bounds.y,
        };
      },
      onWindowBoundsUpdate: () => {
        this.hide();
      },
    });
  }

  protected async adjustHeight(): Promise<void> {
    const isFirstDraw = this.lastHeight === 0;
    await super.adjustHeight();
    if (this.hasNewHeight && isFirstDraw) this.rearrange(this.browserView.getBounds());
  }
}
