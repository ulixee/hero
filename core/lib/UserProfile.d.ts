import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import Page from '@ulixee/unblocked-agent/lib/Page';
import Session from './Session';
export default class UserProfile {
    static export(session: Session): Promise<IUserProfile>;
    static installCookies(session: Session): Promise<UserProfile>;
    static installStorage(session: Session, page: Page): Promise<void>;
}
