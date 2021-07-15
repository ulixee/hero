import IHeroCreateOptions from './IHeroCreateOptions';

export default interface IHeroConfigureOptions extends Omit<IHeroCreateOptions, 'name'> {}
