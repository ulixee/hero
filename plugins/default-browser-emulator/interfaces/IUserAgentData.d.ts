export default interface IUserAgentData {
    brands: {
        brand: string;
        version: string;
    }[];
    platform: string;
    platformVersion: string;
    uaFullVersion: string;
    fullVersionList: {
        brand: string;
        version: string;
    }[];
    architecture?: string;
    model?: string;
    mobile?: boolean;
    wow64?: boolean;
}
