"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StringArrayCheck_1 = require("@double-agent/analyze/lib/checks/StringArrayCheck");
var CodecType;
(function (CodecType) {
    CodecType["audio"] = "audio";
    CodecType["video"] = "video";
})(CodecType || (CodecType = {}));
class CheckGenerator {
    constructor(profile) {
        this.checksByType = {
            [CodecType.audio]: [],
            [CodecType.video]: [],
        };
        this.profile = profile;
        this.extractChecks();
    }
    get audioChecks() {
        return this.checksByType[CodecType.audio];
    }
    get videoChecks() {
        return this.checksByType[CodecType.video];
    }
    // if (checksById[check.id]) throw new Error(`check already exists: ${check.id}`);
    extractChecks() {
        const { userAgentId } = this.profile;
        for (const codecType of [CodecType.audio, CodecType.video]) {
            for (const entryKey of ['probablyPlays', 'maybePlays', 'recordingFormats']) {
                const rawCodecs = this.profile.data[`${codecType}Support`][entryKey];
                const path = `${codecType}Support.${entryKey}`;
                for (const codec of rawCodecs) {
                    const check = new StringArrayCheck_1.default({ userAgentId }, { path }, codec);
                    this.checksByType[codecType].push(check);
                }
            }
        }
        for (const codecType of [CodecType.audio, CodecType.video]) {
            const titleizedCodecsType = codecType.charAt(0).toUpperCase() + codecType.slice(1);
            const path = `webRtc${titleizedCodecsType}Codecs`;
            const rawCodecs = this.profile.data[path];
            const codecs = Array.from(new Set(rawCodecs.map((codec) => {
                return `${codec.clockRate}-${codec.mimeType ?? codec.name}`;
            })));
            for (const codec of codecs) {
                const check = new StringArrayCheck_1.default({ userAgentId }, { path }, codec);
                this.checksByType[codecType].push(check);
            }
        }
    }
}
exports.default = CheckGenerator;
//# sourceMappingURL=CheckGenerator.js.map