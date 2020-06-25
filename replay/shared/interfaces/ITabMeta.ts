import ISaSession from '~shared/interfaces/ISaSession';

export default interface ITabMeta {
  id?: number;
  location?: any;
  saSession?: ISaSession;
  index?: number;
  active?: boolean;
}
