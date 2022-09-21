if (args.userAgentString) {
  proxyGetter(self.navigator, 'userAgent', () => args.userAgentString, true);
  proxyGetter(
    self.navigator,
    'appVersion',
    () => args.userAgentString.replace('Mozilla/', ''),
    true,
  );
}

if ('webdriver' in self.navigator) {
  proxyGetter(self.navigator, 'webdriver', () => false, true);
}

if (args.userAgentData && 'userAgentData' in self.navigator) {
  // @ts-expect-error
  const userAgentData = self.navigator.userAgentData;
  function checkThisArg(thisArg, customMessage = ''): TypeError {
    // @ts-expect-error
    if (Object.getPrototypeOf(thisArg) !== NavigatorUAData.prototype) {
      return new TypeError(`${customMessage}Illegal invocation`);
    }
  }

  proxyGetter(userAgentData, 'brands', (_, thisArg) => {
    const thisArgError = checkThisArg(thisArg);
    if (thisArgError) throw cleanErrorStack(thisArgError);
    const clonedValues = args.userAgentData.brands.map(x => ({ ...x }));

    return Object.seal(Object.freeze(clonedValues));
  });
  proxyGetter(userAgentData, 'platform', (_, thisArg) => {
    const thisArgError = checkThisArg(thisArg);
    if (thisArgError) throw cleanErrorStack(thisArgError);

    return args.userAgentData.platform;
  });
  proxyFunction(userAgentData, 'getHighEntropyValues', async (target, thisArg, argArray) => {
    // TODO: pull Error messages directly from dom extraction files
    let error = checkThisArg(
      thisArg,
      "Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': ",
    );
    if (!error) {
      try {
        // check if these work
        await target.call(thisArg, argArray);
      } catch (e) {
        error = e;
      }
    }
    if (error) return Promise.reject(cleanErrorStack(error));
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
  proxyFunction(self.navigator, 'setAppBadge', (target, thisArg, argArray) => {
    let error: TypeError;
    if (Object.getPrototypeOf(thisArg) !== Navigator.prototype) {
      error = new TypeError("Failed to execute 'setAppBadge' on 'Navigator': Illegal invocation");
    } else if (argArray.length) {
      const arg = argArray[0];
      if (typeof arg === 'number') {
        if (arg < 0 || arg > Number.MAX_SAFE_INTEGER) {
          error = new TypeError(
            `Failed to execute 'setAppBadge' on 'Navigator': Value is outside the 'unsigned long long' value range.`,
          );
        }
      } else {
        error = new TypeError(
          `Failed to execute 'setAppBadge' on 'Navigator': Value is not of type 'unsigned long long'.`,
        );
      }
    }
    if (error) return Promise.reject(cleanErrorStack(error));
    return Promise.resolve(undefined);
  });
}

if ('clearAppBadge' in self.navigator) {
  // @ts-ignore
  proxyFunction(self.navigator, 'clearAppBadge', (target, thisArg, argArray) => {
    let error: TypeError;
    if (Object.getPrototypeOf(thisArg) !== Navigator.prototype) {
      error = new TypeError("Failed to execute 'clearAppBadge' on 'Navigator': Illegal invocation");
    }
    if (error) return Promise.reject(cleanErrorStack(error));
    return Promise.resolve(undefined);
  });
}

if (args.headless === true && 'requestMediaKeySystemAccess' in self.navigator) {
  proxyFunction(self.navigator, 'requestMediaKeySystemAccess', (target, thisArg, argArray) => {
    if (argArray.length < 2) {
      return ProxyOverride.callOriginal;
    }
    const [keySystem, configs] = argArray;
    if (keySystem !== 'com.widevine.alpha' || [...configs].length < 1) {
      return ProxyOverride.callOriginal;
    }
    return target
      .call(thisArg, 'org.w3.clearkey', configs)
      .then(x => {
        proxyGetter(x, 'keySystem', () => keySystem);
        return x;
      })
      .catch(err => cleanErrorStack(err));
  });
}
