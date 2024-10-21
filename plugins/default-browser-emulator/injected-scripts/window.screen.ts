import type { ScriptInput } from './_utils';

export type Args = {
  unAvailHeight?: number;
  unAvailWidth?: number;
  colorDepth?: number;
};

export function main({ args, utils: { replaceGetter } }: ScriptInput<Args>) {
  replaceGetter(
    window.screen,
    'availHeight',
    () => window.screen.height - (args.unAvailHeight ?? 0),
    { onlyForInstance: true },
  );
  replaceGetter(window.screen, 'availWidth', () => window.screen.width - (args.unAvailWidth ?? 0), {
    onlyForInstance: true,
  });

  const colorDepth = args.colorDepth;
  if (colorDepth) {
    replaceGetter(window.screen, 'colorDepth', () => colorDepth, { onlyForInstance: true });
    replaceGetter(window.screen, 'pixelDepth', () => colorDepth, { onlyForInstance: true });
  }
}
