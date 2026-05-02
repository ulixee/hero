import { IStatcounterMarketshare } from '../data';
export default class OsMarketshareGenerator {
    private readonly byId;
    constructor(statcounter: {
        osVersions: IStatcounterMarketshare;
        macVersions: IStatcounterMarketshare;
        winVersions: IStatcounterMarketshare;
    });
    get(key: string): number;
    toJSON(): object;
}
