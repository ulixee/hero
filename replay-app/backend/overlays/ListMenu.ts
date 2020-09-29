import BaseOverlay from "~backend/overlays/BaseOverlay";
import IRectangle from "~shared/interfaces/IRectangle";

export default class ListMenu extends BaseOverlay {
  constructor() {
    const defaultHeight = 300;
    super({
      name: 'list-menu',
      calcBounds(bounds: IRectangle) {
        return {
          width: bounds.width + 32,
          height: defaultHeight,
          x: bounds.x - 16,
          y: bounds.y + bounds.height - 5,
        };
      },
      onWindowBoundsUpdate: () => {
        this.hide();
      },
    });
  }
}
