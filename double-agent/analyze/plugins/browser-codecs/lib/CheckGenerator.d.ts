import StringArrayCheck from '@double-agent/analyze/lib/checks/StringArrayCheck';
import ICodecProfile from '@double-agent/collect-browser-codecs/interfaces/IProfile';
export default class CheckGenerator {
    private readonly profile;
    private readonly checksByType;
    constructor(profile: ICodecProfile);
    get audioChecks(): StringArrayCheck[];
    get videoChecks(): StringArrayCheck[];
    private extractChecks;
}
