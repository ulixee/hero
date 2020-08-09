import { observable } from 'mobx';
import { OverlayStore } from '~frontend/models/OverlayStore';
import ICommandResult from '~shared/interfaces/ICommandResult';

export class Store extends OverlayStore {
  @observable
  public commandLabel: string;
  @observable
  private commandResult: ICommandResult;

  constructor() {
    super({ hideOnBlur: true, persistent: false });
  }

  protected onShowArgs = (commandLabel: string, commandResult: ICommandResult) => {
    this.commandLabel = commandLabel;
    this.commandResult = commandResult;
  };
}

export default new Store();
