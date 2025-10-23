export default interface IStableChromeVersion {
    id: string;
    name: string;
    majorVersion: number;
    buildVersion: number;
    stablePatchesByOs: {
        mac: number[];
        win: number[];
        linux: number[];
    };
}
