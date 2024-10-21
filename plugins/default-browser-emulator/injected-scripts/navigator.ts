import type { ScriptInput } from './_utils';

export type Args = {
  userAgentString: string;
  platform: string;
  headless: boolean;
  pdfViewerEnabled: boolean;
  userAgentData: any;
  rtt: number;
};

export function main({
  args,
  utils: { replaceGetter, ObjectCached, replaceFunction, ReflectCached },
}: ScriptInput<Args>) {
  if (args.userAgentString) {
    replaceGetter(self.navigator, 'userAgent', () => args.userAgentString, {
      onlyForInstance: true,
    });
    replaceGetter(
      self.navigator,
      'appVersion',
      () => args.userAgentString.replace('Mozilla/', ''),
      { onlyForInstance: true },
    );
  }

  if ('NetworkInformation' in self) {
    replaceGetter((self.NetworkInformation as any).prototype as any, 'rtt', () => args.rtt);
  }

  if (args.userAgentData && 'userAgentData' in self.navigator) {
    const userAgentData = self.navigator.userAgentData as any;
    function checkThisArg(thisArg, customMessage = '') {
      if (ObjectCached.getPrototypeOf(thisArg) !== (self as any).NavigatorUAData.prototype) {
        throw new TypeError(`${customMessage}Illegal invocation`);
      }
    }

    replaceGetter(userAgentData, 'brands', (_, thisArg) => {
      checkThisArg(thisArg);
      const clonedValues = args.userAgentData.brands.map(x => ({ ...x }));

      return ObjectCached.seal(ObjectCached.freeze(clonedValues));
    });
    replaceGetter(userAgentData, 'platform', (_, thisArg) => {
      checkThisArg(thisArg);
      return args.userAgentData.platform;
    });
    replaceFunction(userAgentData, 'getHighEntropyValues', async (target, thisArg, argArray) => {
      // TODO: pull Error messages directly from dom extraction files
      checkThisArg(thisArg, "Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': ");
      // check if these work
      await ReflectCached.apply(target, thisArg, argArray);

      const props: any = {
        brands: ObjectCached.seal(ObjectCached.freeze(args.userAgentData.brands)),
        mobile: false,
      };
      if (argArray.length && Array.isArray(argArray[0])) {
        for (const key of argArray[0]) {
          if (key in args.userAgentData) {
            props[key] = args.userAgentData[key];
          }
        }
      }

      return Promise.resolve(props);
    });
  }

  if (args.pdfViewerEnabled && 'pdfViewerEnabled' in self.navigator) {
    replaceGetter(self.navigator, 'pdfViewerEnabled', () => args.pdfViewerEnabled, {
      onlyForInstance: true,
    });
  }

  // always override
  replaceGetter(self.navigator, 'platform', () => args.platform, {
    onlyForInstance: true,
  });
}
