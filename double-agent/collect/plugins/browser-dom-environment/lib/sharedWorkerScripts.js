"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSharedWorker = loadSharedWorker;
exports.sharedWorkerScript = sharedWorkerScript;
const PageNames_1 = require("../interfaces/PageNames");
const loadDomExtractorScript_1 = require("./loadDomExtractorScript");
function loadSharedWorker(ctx) {
    return `
<script type=text/javascript>
(function sharedWorkerProbe() {
    const run = new Promise(resolve => {
        const sharedWorker = new SharedWorker('${ctx.buildUrl('/shared-worker.js')}');
        sharedWorker.port.start()
        sharedWorker.port.addEventListener('message', message => {
            sharedWorker.port.close()
            return resolve()
        })
    });
    self.pageQueue.push(run);
})();
</script>
`;
}
function sharedWorkerScript(ctx) {
    const pageMeta = {
        saveToUrl: ctx.buildUrl('/save'),
        pageUrl: ctx.url.href,
        pageHost: ctx.url.host,
        pageName: PageNames_1.default.SharedWorkerDom,
    };
    ctx.res.setHeader('Content-Type', 'application/javascript');
    ctx.res.end(`
    ${(0, loadDomExtractorScript_1.default)()};
    onconnect = async message => {
		  const port = message.ports[0];
      await runDomExtractor('self', ${JSON.stringify(pageMeta)}');
		  port.postMessage('done');
	  }
  `);
}
//# sourceMappingURL=sharedWorkerScripts.js.map