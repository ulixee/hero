import { DIALOG_MARGIN_TOP, DIALOG_MARGIN } from '~shared/constants/design';
import BaseOverlay from '~backend/overlays/BaseOverlay';
import IRectangle from '~shared/interfaces/IRectangle';

export default class MainMenu extends BaseOverlay {
  constructor() {
    const menuWidth = 330;
    const menuHeight = 204;
    super({
      name: 'main-menu',
      calcBounds(bounds: IRectangle) {
        return {
          width: menuWidth,
          height: menuHeight,
          x: bounds.x - menuWidth + DIALOG_MARGIN + DIALOG_MARGIN,
          y: bounds.y + 20 - DIALOG_MARGIN_TOP,
        };
      },
      onWindowBoundsUpdate: () => {
        this.hide();
      },
    });
  }
}
