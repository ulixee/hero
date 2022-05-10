import { ICookie } from '@unblocked-web/emulator-spec/net/ICookie';

export default interface ISetCookieOptions
  extends Pick<ICookie, 'httpOnly' | 'secure' | 'sameSite'> {
  expires?: Date | number;
}
