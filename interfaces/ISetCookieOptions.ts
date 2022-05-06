import { ICookie } from '@bureau/interfaces/ICookie';

export default interface ISetCookieOptions
  extends Pick<ICookie, 'httpOnly' | 'secure' | 'sameSite'> {
  expires?: Date | number;
}
