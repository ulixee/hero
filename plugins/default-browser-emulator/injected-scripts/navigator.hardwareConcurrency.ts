export type Args = {
  concurrency: number;
};
const typedArgs = args as Args;

replaceGetter(self.navigator, 'hardwareConcurrency', () => typedArgs.concurrency, {
  onlyForInstance: true,
});
