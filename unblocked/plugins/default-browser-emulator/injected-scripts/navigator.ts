if (args.userAgentString) {
  proxyGetter(self.navigator, 'userAgent', () => args.userAgentString, true);
  proxyGetter(
    self.navigator,
    'appVersion',
    () => args.userAgentString.replace('Mozilla/', ''),
    true,
  );
}

if ('NetworkInformation' in self) {
  proxyGetter((self.NetworkInformation as any).prototype as any, 'rtt', () => args.rtt, false);
}

if (args.userAgentData && 'userAgentData' in self.navigator) {
  const userAgentData = self.navigator.userAgentData as any;
  function checkThisArg(thisArg, customMessage = '') {
    // @ts-expect-error
    if (Object.getPrototypeOf(thisArg) !== self.NavigatorUAData.prototype) {
      throw new TypeError(`${customMessage}Illegal invocation`);
    }
  }

  proxyGetter(userAgentData, 'brands', (_, thisArg) => {
    checkThisArg(thisArg);
    const clonedValues = args.userAgentData.brands.map(x => ({ ...x }));

    return Object.seal(Object.freeze(clonedValues));
  });
  proxyGetter(userAgentData, 'platform', (_, thisArg) => {
    checkThisArg(thisArg);
    return args.userAgentData.platform;
  });
  proxyFunction(userAgentData, 'getHighEntropyValues', async (target, thisArg, argArray) => {
    // TODO: pull Error messages directly from dom extraction files
    checkThisArg(thisArg, "Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': ");
    // check if these work
    await ReflectCached.apply(target, thisArg, argArray);

    const props: any = {
      brands: Object.seal(Object.freeze(args.userAgentData.brands)),
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
  proxyGetter(self.navigator, 'pdfViewerEnabled', () => args.pdfViewerEnabled, true);
}

// always override
proxyGetter(self.navigator, 'platform', () => args.platform, true);

if ('setAppBadge' in self.navigator) {
  // @ts-ignore
  proxyFunction(self.navigator, 'setAppBadge', async (target, thisArg, argArray) => {
    if (Object.getPrototypeOf(thisArg) !== Navigator.prototype) {
      throw new TypeError("Failed to execute 'setAppBadge' on 'Navigator': Illegal invocation");
    } else if (argArray.length) {
      const arg = argArray[0];
      if (typeof arg === 'number') {
        if (arg < 0 || arg > Number.MAX_SAFE_INTEGER) {
          throw new TypeError(
            `Failed to execute 'setAppBadge' on 'Navigator': Value is outside the 'unsigned long long' value range.`,
          );
        }
      } else {
        throw new TypeError(
          `Failed to execute 'setAppBadge' on 'Navigator': Value is not of type 'unsigned long long'.`,
        );
      }
    }
    return undefined;
  });
}

if ('clearAppBadge' in self.navigator) {
  // @ts-ignore
  proxyFunction(self.navigator, 'clearAppBadge', async (target, thisArg, argArray) => {
    if (Object.getPrototypeOf(thisArg) !== Navigator.prototype) {
      throw new TypeError("Failed to execute 'clearAppBadge' on 'Navigator': Illegal invocation");
    }
    return undefined;
  });
}

if (args.headless === true && 'requestMediaKeySystemAccess' in self.navigator) {
  proxyFunction(
    self.navigator,
    'requestMediaKeySystemAccess',
    async (target, thisArg, argArray) => {
      if (argArray.length < 2) {
        return ProxyOverride.callOriginal;
      }
      const [keySystem, configs] = argArray;
      if (keySystem !== 'com.widevine.alpha' || [...configs].length < 1) {
        return ProxyOverride.callOriginal;
      }

      const result = await ReflectCached.apply(target, thisArg, ['org.w3.clearkey', configs]);
      proxyGetter(result, 'keySystem', () => keySystem);
      return result;
    },
  );
}
