import { IStatcounterMarketshare } from '../data';
export default class BrowserMarketshareGenerator {
    private readonly byId;
    constructor(browserVersions: IStatcounterMarketshare);
    get(key: string): number;
    toJSON(): object;
}
