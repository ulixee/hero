import SettingsDb, { ISettings } from './SettingsDb';
import HistoryDb, { IHistoryRecord } from './HistoryDb';
import WindowStateDb, { IWindowState } from './WindowStateDb';

class Storage {
  private readonly settingsDb = new SettingsDb();
  private readonly windowStateDb = new WindowStateDb();
  private readonly historyDb = new HistoryDb();

  public get settings(): ISettings {
    return { ...this.settingsDb.fetch() };
  }

  public set settings(settings: ISettings) {
    this.settingsDb.update(settings);
    this.settingsDb.persist();
    // Application.instance.overlayManager.sendToAll('update-settings', settings);
    // for (const window of Application.instance.windowManager.list) {
    //   window.sendToRenderer('update-settings', settings);
    //   window.tabManager.byId.forEach(async v => {
    //     if (v.webContents.getURL().startsWith(INTERNAL_BASE_URL)) {
    //       v.webContents.send('update-settings', settings);
    //     }
    //   });
    // }
  }

  public get windowState(): IWindowState {
    return { ...this.windowStateDb.fetch() };
  }

  public set windowState(windowState: IWindowState) {
    this.windowStateDb.update(windowState);
    this.windowStateDb.persist();
  }

  public addToHistory(record: Partial<IHistoryRecord>) {
    record.id = record.id || `${record.dataLocation}:${record.scriptEntrypoint}`;
    record.lastAccessedAt = new Date().toISOString();
    record.firstAccessedAt = record.lastAccessedAt;
    const prevRecord = this.historyDb.findById(record.id);
    if (prevRecord) {
      record.firstAccessedAt = prevRecord.firstAccessedAt;
      this.historyDb.deleteById(prevRecord.id);
    }
    this.historyDb.insert(record as IHistoryRecord);
    this.historyDb.persist();
  }

  public fetchHistory() {
    return [...this.historyDb.fetchAll()];
  }

  public persistAll() {
    this.settingsDb.persist();
    this.windowStateDb.persist();
    this.historyDb.persist();
  }
}

export default new Storage();
