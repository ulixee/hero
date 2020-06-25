import ITabLocation from '~shared/interfaces/ITabLocation';
import ReplayApi from '~backend/ReplayApi';

export default interface ICreateTabOptions {
  index?: number;
  active?: boolean;
  location?: ITabLocation;
  replayApi?: ReplayApi;
}
