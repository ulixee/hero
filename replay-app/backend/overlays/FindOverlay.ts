import BaseOverlay from './BaseOverlay';
import { VIEW_Y_OFFSET } from '~shared/constants/design';

export default class FindOverlay extends BaseOverlay {
  constructor() {
    super({
      name: 'find',
      bounds: {
        width: 416,
        height: 70,
        y: VIEW_Y_OFFSET,
      },
    });
  }
}
