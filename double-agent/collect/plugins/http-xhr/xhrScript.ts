import { DomainType } from '@double-agent/collect/lib/DomainUtils';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';

export default function xhrScript(ctx: IRequestContext) {
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

function builtRequests(ctx: IRequestContext) {
  const requests: { url: string; func: string; args: object }[] = [];
  for (const domainType of [DomainType.MainDomain, DomainType.SubDomain, DomainType.CrossDomain]) {
    requests.push(
      {
        url: ctx.buildUrl('/axios-nocustom-headers.json', domainType),
        func: 'axios.get',
        args: {
          mode: 'cors',
        },
      },
      {
        url: ctx.buildUrl('/fetch-nocustom-headers.json', domainType),
        func: 'fetch',
        args: {
          mode: 'cors',
        },
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
    );
  }

  return requests;
}

function randomText() {
  return Math.random().toString(36).substring(2);
}
