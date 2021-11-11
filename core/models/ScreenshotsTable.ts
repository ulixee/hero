import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class ScreenshotsTable extends SqliteTable<IScreenshot> {
  public screenshotTimesByTabId = new Map<number, number[]>();
  public storeDuplicates = false;
  public includeWhiteScreens = false;

  private lastImageByTab: { [tabId: number]: Buffer } = {};

  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Screenshots',
      [
        // need text for full precision (will be rounded to two decimals otherwise)
        ['timestamp', 'TEXT', 'NOT NULL PRIMARY KEY'],
        ['tabId', 'INTEGER', 'NOT NULL PRIMARY KEY'],
        ['image', 'BLOB'],
      ],
      true,
    );
  }

  public getImage(tabId: number, timestamp: number): Buffer {
    const lookupTimestamp = String(timestamp);
    if (this.pendingInserts.length) {
      for (const record of this.pendingInserts) {
        if (record[0] === lookupTimestamp && record[1] === tabId) return record[2] as Buffer;
      }
    }
    const record = this.db
      .prepare(`select image from ${this.tableName} where tabId=? and timestamp=?`)
      .get(tabId, lookupTimestamp);
    return record.image;
  }

  public insert(screenshot: IScreenshot): void {
    const { tabId, timestamp, image } = screenshot;
    if (
      !this.storeDuplicates &&
      this.lastImageByTab[tabId] &&
      image.equals(this.lastImageByTab[tabId])
    ) {
      return;
    }
    this.lastImageByTab[tabId] = image;

    if (!this.screenshotTimesByTabId.has(tabId)) {
      this.screenshotTimesByTabId.set(tabId, []);
    }
    this.screenshotTimesByTabId.get(tabId).push(timestamp);

    this.queuePendingInsert([String(timestamp), tabId, image]);
  }

  public static isBlankImage(imageBase64: string): boolean {
    const nonBlankCharsNeeded = imageBase64.length * 0.05;
    let nonBlankChars = 0;
    for (const char of imageBase64) {
      if (char !== 'A') {
        nonBlankChars += 1;
        if (nonBlankChars >= nonBlankCharsNeeded) {
          return false;
        }
      }
    }
    return true;
  }
}

export interface IScreenshot {
  tabId: number;
  timestamp: number;
  image: Buffer;
}
