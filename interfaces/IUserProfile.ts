import { ICookie } from './ICookie';
import IDomStorage from './IDomStorage';

export default interface IUserProfile {
  cookies?: ICookie[];
  storage?: IDomStorage;
}
