"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForIframe = waitForIframe;
exports.iframePage = iframePage;
const PageNames_1 = require("../interfaces/PageNames");
const loadDomExtractorScript_1 = require("./loadDomExtractorScript");
function waitForIframe() {
    return `
<script type=text/javascript>
     const promise = new Promise(resolve => {
         window.addEventListener('message', event => {
            if (event.data && event.data.readDom === true) {
                resolve();
            }
        }, false);
     });
     window.pageQueue.push(promise);
</script>
`;
}
function iframePage(ctx) {
    const pageMeta = {
        saveToUrl: ctx.buildUrl('/save'),
        pageUrl: ctx.url.href,
        pageHost: ctx.url.host,
        pageName: ctx.url.searchParams.get('page-name') ?? PageNames_1.default.IFrameDom,
    };
    ctx.res.setHeader('Content-Type', 'text/html');
    const html = `<!doctype html><html><body>
    <h5>IFrame DOM Test</h5>
    <script type="text/javascript">
    ${(0, loadDomExtractorScript_1.default)()};
    runDomExtractor('self', ${JSON.stringify(pageMeta)}).then(() => {
      window.parent.postMessage({ readDom: true });
    });
    </script>
  </body></html>`;
    ctx.res.end(html);
}
//# sourceMappingURL=iframeScripts.js.map