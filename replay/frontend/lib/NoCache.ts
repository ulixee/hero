import { createDecorator } from 'vue-class-component';

// tslint:disable-next-line:variable-name
const NoCache = createDecorator((options, key) => {
  // component options should be passed to the callback
  // and update for the options object affect the component
  (options.computed[key] as any).cache = false;
});

export default NoCache;
