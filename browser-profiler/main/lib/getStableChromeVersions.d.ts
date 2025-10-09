export default function getStableChromeVersions(take: number): Promise<IStableChromeVersion[]>;
export interface IChromeVersions {
    [versionNumber: string]: {
        mac_arm64: string;
        mac: string;
        linux: string;
        linux_rpm: string;
        win32: string;
        win64: string;
    };
}
export interface IStableChromeVersion {
    id: string;
    major: number;
    versions: {
        fullVersion: string;
        patch: number;
        linux: boolean;
        mac: boolean;
        win: boolean;
    }[];
}
