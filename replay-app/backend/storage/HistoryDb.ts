import BaseDb from './BaseDb';

const MAX_RECORD_COUNT = 100;

export default class HistoryDb extends BaseDb<IHistoryRecord[]> {
  private byId: { [id: string]: IHistoryRecord } = {};

  constructor() {
    super('History', []);
    for (const record of this.allData) {
      if (this.byId[record.id]) {
        this.deleteById(record.id);
      }
      this.byId[record.id] = record;
    }
  }

  public insert(record: IHistoryRecord): void {
    this.byId[record.id] = record;
    this.allData.unshift(record);
    const removedRecords = this.allData.splice(MAX_RECORD_COUNT - 1);
    for (const removedRecord of removedRecords) {
      delete this.byId[removedRecord.id];
    }
  }

  public findById(id: string) {
    return this.byId[id];
  }

  public deleteById(id: string) {
    const record = this.byId[id];
    if (!record) return;

    delete this.byId[id];
    const index = this.allData.indexOf(record);
    if (index < 0) return;

    this.allData.splice(index, 1);
  }

  public fetchAll(): IHistoryRecord[] {
    return [...this.allData];
  }
}

export interface IHistoryRecord {
  id: string;
  dataLocation: string;
  sessionName: string;
  scriptInstanceId: string;
  scriptEntrypoint: string;
  firstAccessedAt: string;
  lastAccessedAt: string;
}
