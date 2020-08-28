import { animateTab } from '../utils/tabs';
import { AppStore } from '~frontend/pages/app/store';

export default class AddTabStore {
  public left = 0;
  public ref: Element;

  constructor(private appStore: AppStore) {}

  public setLeft(left: number, animation: boolean) {
    animateTab('translateX', left, this.ref, animation);
    this.left = left;
  }
}
