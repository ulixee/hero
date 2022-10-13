const { parseHTML } = require('linkedom');

test('can parse html', async () => {
  const fragment = `<tr class="athing" id="30070425">
      <td align="right" valign="top" class="title"><span class="rank">1.</span></td>      <td valign="top" class="votelinks"><center><a id="up_30070425" href="vote?id=30070425&amp;how=up&amp;goto=news"><div class="votearrow" title="upvote"></div></a></center></td><td class="title"><a href="https://www.bloomberg.com/news/articles/2022-01-25/nvidia-is-said-to-quietly-prepare-to-abandon-takeover-of-arm" class="titlelink">Nvidia prepares to abandon takeover of Arm</a><span class="sitebit comhead"> (<a href="from?site=bloomberg.com"><span class="sitestr">bloomberg.com</span></a>)</span></td></tr>`;

  const dom = parseHTML(fragment);
  expect(dom).toBeTruthy();
});
