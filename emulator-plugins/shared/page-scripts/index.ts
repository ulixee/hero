import * as fs from 'fs';
import IPageOverride from '@secret-agent/emulators/interfaces/IPageOverride';

const cache: { [name: string]: string } = {};
const shouldCache = process.env.NODE_ENV === 'production';

const utilsScript = fs.readFileSync(`${__dirname}/utils.js`, 'utf8');

export default function getOverrideScript(name: string, args?: any): IPageOverride {
  let script = cache[name];
  if (!script) {
    script = fs.readFileSync(`${__dirname}/${name}.js`, 'utf8');
  }
  if (shouldCache) cache[name] = script;
  return {
    script: buildExecutionScript(script, args),
  };
}

function buildExecutionScript(script: string, args?: any) {
  return `(function() {
    ${utilsScript}
    
    (function(args) {
      ${script}
    })(${JSON.stringify(args)});
})()`;
}
