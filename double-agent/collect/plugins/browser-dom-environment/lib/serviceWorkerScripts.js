"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadServiceWorker = loadServiceWorker;
exports.serviceWorkerScript = serviceWorkerScript;
const PageNames_1 = require("../interfaces/PageNames");
const loadDomExtractorScript_1 = require("./loadDomExtractorScript");
function loadServiceWorker(ctx) {
    return `
<script type=text/javascript>
(function serviceWorkerProbe() {
    const run = new Promise(resolve => {
        navigator.serviceWorker.register("${ctx.buildUrl('/service-worker.js')}");
        navigator.serviceWorker.ready.then(registration => {
            const broadcast = new BroadcastChannel('da_channel');
            broadcast.onmessage = () => {
                registration.unregister()
                broadcast.close()
                return resolve()
            }
            return broadcast.postMessage({ type: 'domScript' });
        });
    });
    self.pageQueue.push(run);
})();
</script>
`;
}
function serviceWorkerScript(ctx) {
    const pageMeta = {
        saveToUrl: ctx.buildUrl('/save'),
        pageUrl: ctx.url.href,
        pageHost: ctx.url.host,
        pageName: PageNames_1.default.ServiceWorkerDom,
    };
    ctx.res.setHeader('Content-Type', 'application/javascript');
    ctx.res.end(`
    ${(0, loadDomExtractorScript_1.default)()};
    const broadcast = new BroadcastChannel('da_channel');
    broadcast.onmessage = async event => {
        if (event.data && event.data.type == 'domScript') {
            await self.runDomExtractor('self', ${JSON.stringify(pageMeta)});
            broadcast.postMessage('done');
        }
    }
`);
}
//# sourceMappingURL=serviceWorkerScripts.js.map