import ICreateTabOptions from '~shared/interfaces/ICreateTabOptions';
import { InternalLocations } from '~shared/interfaces/ITabLocation';

export const defaultTabOptions: ICreateTabOptions = {
  location: InternalLocations.NewTab,
  active: true,
};
