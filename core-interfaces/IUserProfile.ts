import { ICookie } from './ICookie';
import IResourceMeta from './IResourceMeta';
import IDomStorage from './IDomStorage';

export default interface IUserProfile {
  cookies?: ICookie[];
  storage?: IDomStorage;
}
