import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
export default class ScreenshotsTable extends SqliteTable<IScreenshot> {
    storeDuplicates: boolean;
    includeWhiteScreens: boolean;
    private screenshotTimesByTabId;
    private hasLoadedCounts;
    private lastImageByTab;
    constructor(db: SqliteDatabase);
    getImage(tabId: number, timestamp: number): Buffer;
    getScreenshotTimesByTabId(): ScreenshotsTable['screenshotTimesByTabId'];
    insert(screenshot: IScreenshot): void;
    private trackScreenshotTime;
    static isBlankImage(imageBase64: string): boolean;
}
export interface IScreenshot {
    tabId: number;
    timestamp: number;
    image: Buffer;
}
