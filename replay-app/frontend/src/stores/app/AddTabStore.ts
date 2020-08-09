import { animateTab } from '../../pages/app/utils/tabs';
import { AppStore } from '../app';

export default class AddTabStore {
  public left = 0;
  public ref: Element;

  constructor(private appStore: AppStore) {}

  public setLeft(left: number, animation: boolean) {
    animateTab('translateX', left, this.ref, animation);
    this.left = left;
  }
}
