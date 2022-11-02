import { ICookie } from '@ulixee/unblocked-specification/agent/net/ICookie';

export default interface ISetCookieOptions
  extends Pick<ICookie, 'httpOnly' | 'secure' | 'sameSite'> {
  expires?: Date | number;
}
