import { observable } from 'mobx';
import { OverlayStore } from '~frontend/models/OverlayStore';

export class Store extends OverlayStore {
  @observable
  public title: string;
  @observable
  public message: string;

  constructor() {
    super({ hideOnBlur: true, persistent: false });
  }

  protected onShowArgs = (arg: { message: string; title: string }) => {
    this.message = arg.message;
    this.title = arg.title;
  };
}

export default new Store();
