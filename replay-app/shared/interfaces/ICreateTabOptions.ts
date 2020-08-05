import ITabLocation from '~shared/interfaces/ITabLocation';

export default interface ICreateTabOptions {
  index?: number;
  active?: boolean;
  location?: ITabLocation;
}
