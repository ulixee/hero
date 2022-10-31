import StringArrayCheck from '@double-agent/analyze/lib/checks/StringArrayCheck';
import ICodecProfile from '@double-agent/collect-browser-codecs/interfaces/IProfile';

enum CodecType {
  audio = 'audio',
  video = 'video',
}

export default class CheckGenerator {
  private readonly profile: ICodecProfile;
  private readonly checksByType = {
    [CodecType.audio]: [] as StringArrayCheck[],
    [CodecType.video]: [] as StringArrayCheck[],
  };

  constructor(profile: ICodecProfile) {
    this.profile = profile;
    this.extractChecks();
  }

  public get audioChecks(): StringArrayCheck[] {
    return this.checksByType[CodecType.audio];
  }

  public get videoChecks(): StringArrayCheck[] {
    return this.checksByType[CodecType.video];
  }

  // if (checksById[check.id]) throw new Error(`check already exists: ${check.id}`);

  private extractChecks(): void {
    const { userAgentId } = this.profile;

    for (const codecType of [CodecType.audio, CodecType.video]) {
      for (const entryKey of ['probablyPlays', 'maybePlays', 'recordingFormats']) {
        const rawCodecs = this.profile.data[`${codecType}Support`][entryKey];
        const path = `${codecType}Support.${entryKey}`;
        for (const codec of rawCodecs) {
          const check = new StringArrayCheck({ userAgentId }, { path }, codec);
          this.checksByType[codecType].push(check);
        }
      }
    }

    for (const codecType of [CodecType.audio, CodecType.video]) {
      const titleizedCodecsType = codecType.charAt(0).toUpperCase() + codecType.slice(1);
      const path = `webRtc${titleizedCodecsType}Codecs`;
      const rawCodecs = this.profile.data[path];
      const codecs: string[] = Array.from(
        new Set(
          rawCodecs.map((codec) => {
            return `${codec.clockRate}-${codec.mimeType ?? (codec as any).name}`;
          }),
        ),
      );
      for (const codec of codecs) {
        const check = new StringArrayCheck({ userAgentId }, { path }, codec);
        this.checksByType[codecType].push(check);
      }
    }
  }
}
