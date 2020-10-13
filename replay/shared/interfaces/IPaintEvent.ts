import { IDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';

export default interface IPaintEvent {
  timestamp: string;
  commandId: number;
  changeEvents: IDomChangeEvent[];
}
