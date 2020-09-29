import BaseOverlay from '~backend/overlays/BaseOverlay';
import IRectangle from '~shared/interfaces/IRectangle';

export default class LocationsMenu extends BaseOverlay {
  constructor() {
    const menuHeight = 470;
    super({
      name: 'locations-menu',
      calcBounds(bounds: IRectangle) {
        return {
          width: bounds.width + 32,
          height: menuHeight,
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
