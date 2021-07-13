export function readCommandLineArgs(): any {
  const input = {};
  const argv = process.argv.slice(2);

  for (const arg of argv) {
    const [rawArg, ...values] = arg.split('=');
    if (!rawArg.startsWith('--input')) return null;
    let name = rawArg.replace('--input', '');
    if (name.startsWith('.')) name = name.substr(1);

    let value = values.join('=');
    if (value.startsWith('"') && value.endsWith('"')) value = value.substr(1, value.length - 2);

    let owner = input;
    const path = name.split('.');
    const param = path.pop();
    for (const entry of path) {
      if (!owner[entry]) {
        if (!Number.isNaN(entry) && entry === '0') {
          owner[entry] = [];
        } else {
          owner[entry] = {};
        }
      }
      owner = owner[entry];
    }

    owner[param] = value;
  }
  return input;
}
