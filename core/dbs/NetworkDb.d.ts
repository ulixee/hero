import CertificatesTable from '../models/CertificatesTable';
export default class NetworkDb {
    private databaseDir;
    readonly certificates: CertificatesTable;
    private db;
    private readonly batchInsert;
    private readonly saveInterval;
    private readonly tables;
    constructor(databaseDir: string);
    close(): void;
    flush(): void;
}
