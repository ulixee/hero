"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = xhrScript;
const DomainUtils_1 = require("@double-agent/collect/lib/DomainUtils");
function xhrScript(ctx) {
    return `
<script type="text/javascript">
  const requests = ${JSON.stringify(builtRequests(ctx))};
  async function runRequests() {
    let count = 0;
    for (const x of requests) {
      count += 1;
      if (x.func === 'axios.get') {
        console.log('RUNNING axios.get', count, 'of', requests.length, x.url, x.args);
        await axios.get(x.url, x.args || {}).catch(console.log);
        console.log('COMPLETED axios.get', count, 'of', requests.length, x.url, x.args);
      } else if (x.func === 'axios.post') {
        console.log('RUNNING axios.post', count, 'of', requests.length, x.url, x.args);
        await axios.post(x.url, x.args.body || {}, x.args).catch(console.log);
        console.log('COMPLETED axios.get', count, 'of', requests.length, x.url, x.args);
      } else {
        console.log('RUNNING fetch', count, 'of', requests.length, x.url, x.args);
        await fetch(x.url, x.args || {}).catch(console.log);
        console.log('COMPLETED fetch', count, 'of', requests.length, x.url, x.args);
      }
    }
  }
  window.pageQueue.push(runRequests());
</script>`;
}
// HELPERS
const headerCaseTest = 'X-HeaDer-sessionId';
function builtRequests(ctx) {
    const requests = [];
    for (const domainType of [DomainUtils_1.DomainType.MainDomain, DomainUtils_1.DomainType.SubDomain, DomainUtils_1.DomainType.CrossDomain]) {
        requests.push({
            url: ctx.buildUrl('/axios-nocustom-headers.json', domainType),
            func: 'axios.get',
            args: {
                mode: 'cors',
            },
        }, {
            url: ctx.buildUrl('/fetch-nocustom-headers.json', domainType),
            func: 'fetch',
            args: {
                mode: 'cors',
            },
        }, {
            url: ctx.buildUrl('/fetch-post-nocustom-headers.json', domainType),
            func: 'fetch',
            args: {
                mode: 'cors',
                method: 'post',
                body: JSON.stringify({
                    [randomText()]: randomText(),
                    [randomText()]: randomText(),
                    [randomText()]: randomText(),
                }),
            },
        }, {
            url: ctx.buildUrl('/post-nocustom-headers.json', domainType),
            func: 'axios.post',
            args: {
                mode: 'cors',
                method: 'post',
                body: JSON.stringify({
                    [randomText()]: randomText(),
                    [randomText()]: randomText(),
                    [randomText()]: randomText(),
                }),
            },
        }, {
            url: ctx.buildUrl('/fetch-custom-headers.json', domainType),
            func: 'fetch',
            args: {
                mode: 'cors',
                headers: {
                    [headerCaseTest]: randomText(),
                    'x-lower-sessionid': randomText(),
                    [randomText()]: '1',
                },
            },
        }, {
            url: ctx.buildUrl('/axios-custom-headers.json', domainType),
            func: 'axios.get',
            args: {
                mode: 'cors',
                headers: {
                    [headerCaseTest]: randomText(),
                    'x-lower-sessionid': randomText(),
                    [randomText()]: '1',
                },
            },
        }, {
            url: ctx.buildUrl('/fetch-post-custom-headers.json', domainType),
            func: 'fetch',
            args: {
                method: 'post',
                mode: 'cors',
                headers: {
                    [headerCaseTest]: randomText(),
                    'x-lower-sessionid': randomText(),
                    [randomText()]: '1',
                },
                body: JSON.stringify({
                    [randomText()]: randomText(),
                    [randomText()]: randomText(),
                    [randomText()]: randomText(),
                }),
            },
        }, {
            url: ctx.buildUrl('/post-custom-headers.json', domainType),
            func: 'axios.post',
            args: {
                mode: 'cors',
                headers: {
                    [headerCaseTest]: randomText(),
                    'x-lower-sessionid': randomText(),
                    [randomText()]: '1',
                },
                body: JSON.stringify({
                    [randomText()]: randomText(),
                    [randomText()]: randomText(),
                    [randomText()]: randomText(),
                }),
            },
        });
    }
    return requests;
}
function randomText() {
    return Math.random().toString(36).substring(2);
}
//# sourceMappingURL=xhrScript.js.map