import { ICookie } from '@unblocked-web/specifications/agent/net/ICookie';

export default interface ISetCookieOptions
  extends Pick<ICookie, 'httpOnly' | 'secure' | 'sameSite'> {
  expires?: Date | number;
}
