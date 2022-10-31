import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import PageNames from '../interfaces/PageNames';
import loadDomExtractorScript, { IDomExtractorPageMeta } from './loadDomExtractorScript';

export function loadDedicatedWorker(ctx: IRequestContext) {
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

export function dedicatedWorkerScript(ctx: IRequestContext) {
  const pageMeta: IDomExtractorPageMeta = {
    saveToUrl: ctx.buildUrl('/save'),
    pageUrl: ctx.url.href,
    pageHost: ctx.url.host,
    pageName: PageNames.DedicatedWorkerDom,
  };
  ctx.res.setHeader('Content-Type', 'application/javascript');
  ctx.res.end(`
    ${loadDomExtractorScript()};
    runDomExtractor('self', ${JSON.stringify(pageMeta)})
      .then(() => {
          postMessage('done');
          close();
      });
`);
}
