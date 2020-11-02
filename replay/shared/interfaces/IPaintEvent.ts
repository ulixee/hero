import { IFrontendDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';

export default interface IPaintEvent {
  timestamp: string;
  commandId: number;
  changeEvents: IFrontendDomChangeEvent[];
}
