"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDedicatedWorker = loadDedicatedWorker;
exports.dedicatedWorkerScript = dedicatedWorkerScript;
const PageNames_1 = require("../interfaces/PageNames");
const loadDomExtractorScript_1 = require("./loadDomExtractorScript");
function loadDedicatedWorker(ctx) {
    return `
<script type=text/javascript>
(function dedicatedWorkerProbe() {
    const run = new Promise(resolve => {
        const worker = new Worker('${ctx.buildUrl('/dedicated-worker.js')}');
        worker.onmessage = message => {
            worker.terminate()
            return resolve()
        }
    });
    self.pageQueue.push(run);
})();
</script>
`;
}
function dedicatedWorkerScript(ctx) {
    const pageMeta = {
        saveToUrl: ctx.buildUrl('/save'),
        pageUrl: ctx.url.href,
        pageHost: ctx.url.host,
        pageName: PageNames_1.default.DedicatedWorkerDom,
    };
    ctx.res.setHeader('Content-Type', 'application/javascript');
    ctx.res.end(`
    ${(0, loadDomExtractorScript_1.default)()};
    runDomExtractor('self', ${JSON.stringify(pageMeta)})
      .then(() => {
          postMessage('done');
          close();
      });
`);
}
//# sourceMappingURL=dedicatedWorkerScripts.js.map