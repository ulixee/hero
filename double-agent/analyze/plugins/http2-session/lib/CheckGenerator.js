"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NumberCheck_1 = require("@double-agent/analyze/lib/checks/NumberCheck");
const BooleanCheck_1 = require("@double-agent/analyze/lib/checks/BooleanCheck");
class CheckGenerator {
    constructor(profile) {
        this.checks = [];
        this.profile = profile;
        const { userAgentId, data } = profile;
        this.userAgentId = userAgentId;
        const sessionCount = new NumberCheck_1.default({ userAgentId }, { path: 'sessions' }, data.sessions.length);
        this.checks.push(sessionCount);
        if (data.sessions.length) {
            const [session] = data.sessions;
            const remoteSettings = session.activity.find(x => x.type === 'remoteSettings');
            if (remoteSettings) {
                for (const [key, value] of Object.entries(remoteSettings.data)) {
                    const path = `remoteSettings.${key}`;
                    if (typeof value === 'number') {
                        this.checks.push(new NumberCheck_1.default({ userAgentId }, { path }, value));
                    }
                    else if (typeof value === 'boolean') {
                        this.checks.push(new BooleanCheck_1.default({ userAgentId }, { path }, value));
                    }
                }
            }
            const firstStream = session.activity.find(x => x.type === 'stream' && x.data.path !== '/favicon.ico');
            if (firstStream) {
                const { weight, flags } = firstStream.data;
                this.checks.push(new NumberCheck_1.default({ userAgentId }, { path: `frame.weight` }, weight));
                const flagOrder = [
                    'END_STREAM',
                    'RESERVED2',
                    'END_HEADERS',
                    'PADDED',
                    'RESERVED5',
                    'PRIORITY',
                ];
                const flagsSet = [...flags.toString(2)].map((x, i) => ({
                    flag: flagOrder[i],
                    isSet: x === '1',
                }));
                for (const { flag, isSet } of flagsSet) {
                    this.checks.push(new BooleanCheck_1.default({ userAgentId }, { path: `frame.flags.${flag}` }, isSet));
                }
            }
        }
    }
}
exports.default = CheckGenerator;
//# sourceMappingURL=CheckGenerator.js.map