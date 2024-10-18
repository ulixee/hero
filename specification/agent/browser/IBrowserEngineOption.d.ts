export default interface IBrowserEngineOption {
    id: string;
    name: string;
    majorVersion: number;
    buildVersion: number;
    stablePatchesByOs: {
        mac: number[];
        win: number[];
        linux: number[];
    };
    features: string[];
    bypass?: boolean;
}
