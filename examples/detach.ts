import agent, { LocationStatus } from 'secret-agent';

async function run() {
  console.time('Detach');
  await agent.goto('https://chromium.googlesource.com/chromium/src/+refs');
  await agent.activeTab.waitForLoad(LocationStatus.DomContentLoaded);
  await agent.waitForPaintingStable();

  console.timeLog('Detach', 'got sync result');
  const detached = await agent.detach(agent.activeTab);
  console.timeLog('Detach', 'detached');
  const { document } = detached;
  console.log(document);

  const wrapperElements = await document.querySelectorAll('.RefList');
  console.log(wrapperElements);
  console.timeLog('Detach', 'wrapped list');
  const versions = [];
  for (const elem of wrapperElements) {
    console.log(elem);
    const innerText = await elem.querySelector('.RefList-title').innerText;
    if (innerText === 'Tags') {
      console.timeLog('Detach', 'found tags');
      const aElems = await elem.querySelectorAll('ul.RefList-items li a');
      console.timeLog('Detach', 'loaded tag elems');

      for (const aElem of aElems) {
        const version = await aElem.innerText;
        versions.push(version);
      }

      console.timeLog('Detach', 'looped through versions');
      break;
    }
  }
  console.log(versions.length);
  console.timeEnd('Detach');
  await agent.close();
}

run().catch(error => console.log(error));
