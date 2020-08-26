import { observable } from 'mobx';
import { OverlayStore } from '~frontend/models/OverlayStore';
import ICommandWithResult from '~shared/interfaces/ICommandResult';

export class Store extends OverlayStore {
  @observable
  public commandLabel: string;

  @observable
  private commandResult: ICommandWithResult;

  constructor() {
    super({ hideOnBlur: true, persistent: false });
  }

  protected onShowArgs = (commandLabel: string, commandResult: ICommandWithResult) => {
    this.commandLabel = commandLabel;
    this.commandResult = commandResult;
  };
}

export default new Store();
