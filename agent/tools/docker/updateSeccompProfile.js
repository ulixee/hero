const Https = require('https');
const Fs = require('fs');
const extraPermissions = {
    comment: 'Allow create user namespaces',
    names: ['clone', 'setns', 'unshare'],
    action: 'SCMP_ACT_ALLOW',
    args: [],
    includes: {},
    excludes: {},
};
Https.get('https://raw.githubusercontent.com/docker/engine/master/profiles/seccomp/default.json')
    .on('response', async (response) => {
    let json = '';
    for await (const chunk of response) {
        json += chunk.toString();
    }
    const defaultProfile = JSON.parse(json);
    defaultProfile.syscalls.unshift(extraPermissions);
    Fs.writeFileSync(`${__dirname}/docker_seccomp_profile.json`, JSON.stringify(defaultProfile, null, 2));
})
    .end();
//# sourceMappingURL=updateSeccompProfile.js.map