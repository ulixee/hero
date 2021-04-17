import { IFrontendDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';

export default interface IPaintEvent {
  timestamp: number;
  commandId: number;
  changeEvents: IFrontendDomChangeEvent[];
}
