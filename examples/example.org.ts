import Hero from '@ulixee/hero';
import { LocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';

// NOTE: You need to start a Ulixee Miner to run this example
async function run() {
  const hero = new Hero();
  await hero.goto('https://example.org/');
  await hero.waitForPaintingStable();

  console.log('\n-- PRINTING location.href ---------');
  console.log(await hero.url);

  const outerHtml = await hero.document.documentElement.outerHTML;
  const linkElement = hero.document.querySelector('a');

  console.log('-- PRINTING outerHTML of link ---------------');
  console.log(outerHtml);
  console.log('OUTPUT from https://example.org', {
    outerHtml,
    title: await hero.document.title,
    intro: await hero.document.querySelector('p').textContent,
    linkTag: await linkElement.outerHTML,
  });
  console.log('-------------------------------------');

  await linkElement.$click();
  await hero.waitForLocation(LocationTrigger.change);
  console.log('NEW LOCATION: ', await hero.document.location.href);
  console.log('-------------------------------------');

  await hero.close();
}

run().catch(error => console.log(error));
