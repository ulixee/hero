export type Args = {
  unAvailHeight?: number;
  unAvailWidth?: number;
  colorDepth?: number;
};

const typedArgs = args as Args;

replaceGetter(
  window.screen,
  'availHeight',
  () => window.screen.height - (typedArgs.unAvailHeight ?? 0),
  { onlyForInstance: true },
);
replaceGetter(
  window.screen,
  'availWidth',
  () => window.screen.width - (typedArgs.unAvailWidth ?? 0),
  { onlyForInstance: true },
);

const colorDepth = typedArgs.colorDepth;
if (colorDepth) {
  replaceGetter(window.screen, 'colorDepth', () => colorDepth, { onlyForInstance: true });
  replaceGetter(window.screen, 'pixelDepth', () => colorDepth, { onlyForInstance: true });
}
