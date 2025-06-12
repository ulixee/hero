import { IVersion } from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
export default function getTcpSettingsForOs(name: string, version: IVersion): {
    ttl: number;
    windowSize: number;
};
