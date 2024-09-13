import IProfile from '@double-agent/collect-http2-session/interfaces/IProfile';
import NumberCheck from '@double-agent/analyze/lib/checks/NumberCheck';
import BooleanCheck from '@double-agent/analyze/lib/checks/BooleanCheck';

export default class CheckGenerator {
  public readonly checks = [];

  private readonly profile: IProfile;
  private readonly userAgentId: string;

  constructor(profile: IProfile) {
    this.profile = profile;

    const { userAgentId, data } = profile;
    this.userAgentId = userAgentId;

    const sessionCount = new NumberCheck(
      { userAgentId },
      { path: 'sessions' },
      data.sessions.length,
    );
    this.checks.push(sessionCount);

    if (data.sessions.length) {
      const [session] = data.sessions;

      const remoteSettings = session.activity.find(x => x.type === 'remoteSettings');
      if (remoteSettings) {
        for (const [key, value] of Object.entries(remoteSettings.data)) {
          const path = `remoteSettings.${key}`;
          if (typeof value === 'number') {
            this.checks.push(new NumberCheck({ userAgentId }, { path }, value));
          } else if (typeof value === 'boolean') {
            this.checks.push(new BooleanCheck({ userAgentId }, { path }, value));
          }
        }
      }

      const firstStream = session.activity.find(
        x => x.type === 'stream' && x.data.path !== '/favicon.ico',
      );
      if (firstStream) {
        const { weight, flags } = firstStream.data;
        this.checks.push(new NumberCheck({ userAgentId }, { path: `frame.weight` }, weight));
        const flagOrder = [
          'END_STREAM',
          'RESERVED2',
          'END_HEADERS',
          'PADDED',
          'RESERVED5',
          'PRIORITY',
        ];
        const flagsSet = [...(flags as number).toString(2)].map((x, i) => ({
          flag: flagOrder[i],
          isSet: x === '1',
        }));
        for (const { flag, isSet } of flagsSet) {
          this.checks.push(
            new BooleanCheck({ userAgentId }, { path: `frame.flags.${flag}` }, isSet),
          );
        }
      }
    }
  }
}
