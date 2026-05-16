import IOperatingSystemVersion from '../interfaces/IOperatingSystemVersion';
import IBrowserVersion from '../interfaces/IBrowserVersion';
export default function extractUserAgentMeta(userAgentString: any): {
    name: string;
    version: IBrowserVersion;
    osName: string;
    osVersion: IOperatingSystemVersion;
};
