import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import PageNames from '../interfaces/PageNames';
import loadDomExtractorScript, { IDomExtractorPageMeta } from './loadDomExtractorScript';

export function waitForIframe() {
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

export function iframePage(ctx: IRequestContext) {
  const pageMeta: IDomExtractorPageMeta = {
    saveToUrl: ctx.buildUrl('/save'),
    pageUrl: ctx.url.href,
    pageHost: ctx.url.host,
    pageName: ctx.url.searchParams.get('page-name') ?? PageNames.IFrameDom,
  };
  ctx.res.setHeader('Content-Type', 'text/html');

  const html = `<!doctype html><html><body>
    <h5>IFrame DOM Test</h5>
    <script type="text/javascript">
    ${loadDomExtractorScript()};
    runDomExtractor('self', ${JSON.stringify(pageMeta)}).then(() => {
      window.parent.postMessage({ readDom: true });
    });
    </script>
  </body></html>`;
  ctx.res.end(html);
}
