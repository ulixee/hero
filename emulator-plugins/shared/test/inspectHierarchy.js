// copied from double-agent. do not modify manually!

module.exports = async function inspect(obj, parentPath) {
  const skipProps = [
    'Fingerprint2',
    'pageQueue',
    'afterQueueComplete',
    'pageLoaded',
    'axios',
    'justAFunction',
  ];
  const skipValues = ['innerHTML', 'outerHTML', 'innerText', 'outerText'];
  const doNotInvoke = [
    'print',
    'alert',
    'prompt',
    'confirm',
    'open',
    'reload',
    'assert',
    'requestPermission',
    'screenshot',
    'pageLoaded',

    'write',
    'writeln',
    'replaceWith',
    'remove',

    'window.history.back',
    'window.history.forward',
    'window.history.go',
    'window.history.pushState',
    'window.history.replaceState',
  ];
  const doNotAccess = [
    'window.CSSAnimation.prototype.timeline', // crashes Safari
    'window.Animation.prototype.timeline', // crashes Safari
    'window.CSSTransition.prototype.timeline', // crashes Safari
  ];
  const loadedObjects = new Map();
  if (typeof window !== 'undefined') loadedObjects.set(window, 'window');
  const hierarchyNav = new Map();
  const detached = {};

  const result = await extractPropsFromObject(obj, parentPath);
  // NOTE: need to stringify to make sure this transfers same as it will from a browser window
  return JSON.stringify({ window: result, detached });

  async function extractPropsFromObject(obj, parentPath) {
    const keys = [];
    let symbols = [];
    try {
      for (const key of Object.getOwnPropertyNames(obj)) {
        if (!keys.includes(key)) keys.push(key);
      }
    } catch (err) {}
    try {
      symbols = Object.getOwnPropertySymbols(obj);
      for (const key of symbols) {
        if (!keys.includes(key)) keys.push(key);
      }
    } catch (err) {}

    try {
      for (const key in obj) {
        if (!keys.includes(key)) keys.push(key);
      }
    } catch (err) {}

    const protos = await loadProtoHierarchy(obj, parentPath);

    const newObj = {
      _protos: protos,
    };
    if (
      parentPath.includes('window.document.') &&
      !parentPath.includes('window.document.documentElement') &&
      newObj._protos.includes('HTMLElement.prototype')
    ) {
      newObj._skipped = 'SKIPPED ELEMENT';
      return newObj;
    }

    if (parentPath.includes('new()') && parentPath.endsWith('.ownerElement')) {
      newObj._skipped = 'SKIPPED ELEMENT';
      return newObj;
    }

    if (parentPath.split('.').length >= 8) {
      newObj._skipped = 'SKIPPED MAX DEPTH';
      return newObj;
    }

    const isNewObject = parentPath.includes('.new()');
    if (isNewObject && newObj._protos[0] === 'HTMLDocument.prototype') {
      newObj._skipped = 'SKIPPED DOCUMENT';
      newObj._type = 'HTMLDocument.prototype';
      return newObj;
    }
    if (Object.isFrozen(obj)) newObj.isFrozen = true;
    if (Object.isSealed(obj)) newObj.isSealed = true;
    if (!newObj._protos.length) delete newObj._protos;

    for (const key of keys) {
      if (skipProps.includes(key)) {
        continue;
      }
      if (key === 'constructor') continue;

      const path = `${parentPath  }.${  String(key)}`;
      if (path.endsWith('_GLOBAL_HOOK__')) continue;

      const prop = `${  String(key)}`;
      if (
        path.startsWith('window.document') &&
        typeof key === 'string' &&
        (key.startsWith('child') ||
          key.startsWith('first') ||
          key.startsWith('last') ||
          key.startsWith('next') ||
          key.startsWith('prev') ||
          key === 'textContent' ||
          key === 'text')
      ) {
        newObj[prop] = { _skipped: 'SKIPPED DOM' };
        continue;
      }

      if (path.startsWith('window.document') && path.split('.').length > 5) {
        newObj[prop] = { _type: 'object', _skipped: 'SKIPPED DEPTH' };
        continue;
      }

      if (key === 'style') {
        if (isNewObject) {
          newObj[prop] = { _type: 'object', _skipped: 'SKIPPED STYLE' };
          continue;
        }
      }
      if (hierarchyNav.has(path)) {
        newObj[prop] = hierarchyNav.get(path);
        // const descriptor = await getDescriptor(obj, key);
        // Object.assign(newObj[prop], descriptor);
        continue;
      }

      if (doNotAccess.includes(path)) {
        continue;
      }

      try {
        const value = await extractPropValue(obj, key, path);
        const isOwnProp = obj.hasOwnProperty && obj.hasOwnProperty(key);
        if (value && typeof value === 'string' && value.startsWith('REF:') && !isOwnProp) {
          // don't assign here
          // console.log('skipping ref', value);
        } else {
          newObj[prop] = value;
        }
      } catch (err) {
        newObj[prop] = err.toString();
      }
    }
    try {
      if (obj.prototype) {
        const instance = await new obj();
        newObj['new()'] = await extractPropsFromObject(instance, `${parentPath  }.new()`);
      }
    } catch (err) {
      newObj['new()'] = err.toString();
    }
    return newObj;
  }

  async function loadProtoHierarchy(obj, parentPath) {
    const hierarchy = [];
    let proto = obj;
    if (typeof proto === 'function') return hierarchy;

    while (proto) {
      proto = Object.getPrototypeOf(proto);

      if (!proto) break;

      try {
        const name = getObjectName(proto);
        hierarchy.push(name);

        if (loadedObjects.has(proto)) continue;

        let path = `window.${  name}`;
        const topType = name.split('.').shift();
        if (!(topType in window)) {
          path = `detached.${  name}`;
        }

        if (!hierarchyNav.has(path)) {
          hierarchyNav.set(path, {});
          const extracted = await extractPropsFromObject(proto, path);
          hierarchyNav.set(path, extracted);
          if (!path.includes('window.')) {
            detached[name] = extracted;
          }
        }
      } catch (err) {}
    }
    return hierarchy;
  }

  async function extractPropValue(obj, key, path) {
    if (obj === null || obj === undefined || !key) {
      return undefined;
    }

    let accessException;
    const value = await new Promise(async (resolve, reject) => {
      let didResolve = false;
      // if you wait on a promise, it will hang!
      const t = setTimeout(() => reject('Likely a Promise'), 200);
      try {
        const p = await obj[key];
        if (didResolve) return;
        didResolve = true;
        clearTimeout(t);
        resolve(p);
      } catch (err) {
        if (didResolve) return;
        clearTimeout(t);
        reject(err);
      }
    }).catch(err => {
      accessException = err;
    });

    if (
      value &&
      path !== 'window.document' &&
      (typeof value === 'function' || typeof value === 'object' || typeof value === 'symbol')
    ) {
      if (loadedObjects.has(value)) {
        return `REF: ${  loadedObjects.get(value)}`;
      }
      // safari will end up in an infinite loop since each plugin is a new object as your traverse
      if (path.includes('.navigator') && path.endsWith('.enabledPlugin')) {
        return 'REF: window.navigator.plugins.X';
      }
      loadedObjects.set(value, path);
    }

    let details = {};
    if (value && (typeof value === 'object' || typeof value === 'function')) {
      details = await extractPropsFromObject(value, path);
    }
    const descriptor = await getDescriptor(obj, key, accessException, path);

    if (!Object.keys(descriptor).length && !Object.keys(details).length) return undefined;
    const prop = Object.assign(details, descriptor);
    if (prop._value === `REF: ${  path}`) {
      prop._value = undefined;
    }
    return prop;
  }

  async function getDescriptor(obj, key, accessException, path) {
    const objDesc = Object.getOwnPropertyDescriptor(obj, key);

    if (!objDesc) {
      const plainObject = {};

      if (accessException && String(accessException).includes('Likely a Promise')) {
        plainObject._value = 'Likely a Promise';
      } else if (accessException) return plainObject;
      let value;
      try {
        value = obj[key];
      } catch (err) {}

      let type = typeof value;
      if (value && Array.isArray(value)) type = 'array';

      const functionDetails = await getFunctionDetails(value, obj, key, type, path);
      plainObject._type = functionDetails.type;
      plainObject._value = getValueString(value, key);
      plainObject._func = functionDetails.func;
      plainObject._invocation = functionDetails.invocation;

      return plainObject;
    } 
      let value;
      try {
        value = objDesc.value;
        if (!value && !accessException) {
          value = obj[key];
        }
      } catch (err) {}

      let type = typeof value;
      value = getValueString(value, key);
      const functionDetails = await getFunctionDetails(value, obj, key, type, path);
      type = functionDetails.type;

      const flags = [];
      if (objDesc.configurable) flags.push('c');
      if (objDesc.enumerable) flags.push('e');
      if (objDesc.writable) flags.push('w');

      return {
        _type: type,
        _function: functionDetails.func,
        _invocation: functionDetails.invocation,
        _flags: flags.join(''),
        _accessException: accessException ? accessException.toString() : undefined,
        _value: value,
        _get: objDesc.get ? objDesc.get.toString() : undefined,
        _set: objDesc.set ? objDesc.set.toString() : undefined,
        _getToStringToString: objDesc.get ? objDesc.get.toString.toString() : undefined,
        _setToStringToString: objDesc.set ? objDesc.set.toString.toString() : undefined,
      };
    
  }

  async function getFunctionDetails(value, obj, key, type, path) {
    let func;
    let invocation;
    if (type === 'undefined') type = undefined;
    if (type === 'function') {
      type = undefined;
      try {
        func = String(value);
      } catch (err) {
        func = err.toString();
      }
      try {
        if (!doNotInvoke.includes(key) && !doNotInvoke.includes(path) && !value.prototype) {
          invocation = await new Promise(async (resolve, reject) => {
            const c = setTimeout(() => reject('Promise-like'), 250);
            let didReply = false;
            try {
              let answer = obj[key]();
              if (answer && answer.on) {
                answer.on('error', err => {
                  console.log('Error', err, obj, key);
                });
              }
              answer = await answer;

              if (didReply) return;
              clearTimeout(c);
              didReply = true;
              resolve(answer);
            } catch (err) {
              if (didReply) return;
              didReply = true;
              clearTimeout(c);
              reject(err);
            }
          }).catch(err => {
            invocation = err.toString();
          });
        }
      } catch (err) {
        invocation = err.toString();
      }
    }
    return {
      func,
      invocation: getValueString(invocation),
      type,
    };
  }

  function getValueString(value, key) {
    if (key && skipValues.includes(key)) {
      return 'SKIPPED VALUE';
    }
    try {
      if (value && typeof value === 'symbol') {
        value = `${  String(value)}`;
      } else if (value && (value instanceof Promise || typeof value.then === 'function')) {
        value = 'Promise';
      } else if (value && typeof value === 'object') {
        if (loadedObjects.has(value)) {
          return `REF: ${  loadedObjects.get(value)}`;
        } 
          value = String(value);
        
      } else if (value && typeof value === 'string') {
        const url = '${ctx.url.href}';
        const host = '${ctx.url.host}';
        while (value.includes(url)) {
          value = value.replace(url, '<url>');
        }
        while (value.includes(host)) {
          value = value.replace(host, '<host>');
        }

        value = value.replace(/<url>\:\d+\:\d+/g, '<url>:<lines>');
      }
    } catch (err) {
      value = err.toString();
    }
    return value;
  }

  function getObjectName(obj) {
    if (obj === Object) return 'Object';
    if (obj === Object.prototype) return 'Object.prototype';
    try {
      if (typeof obj === 'symbol') {
        return `${  String(obj)}`;
      }
    } catch (err) {}
    try {
      let name = obj[Symbol.toStringTag];
      if (!name) {
        try {
          name = obj.name;
        } catch (err) {}
      }

      if (obj.constructor) {
        const constructorName = obj.constructor.name;

        if (constructorName && constructorName !== Function.name) {
          name = constructorName;
        }
      }

      if ('prototype' in obj) {
        name = obj.prototype[Symbol.toStringTag] || obj.prototype.name || name;
        if (name) return name;
      }

      if (typeof obj === 'function') {
        if (name && name !== Function.name) return name;
        return obj.constructor.name;
      }

      if (!name) return;

      return `${name  }.prototype`;
    } catch (err) {}
  }
};
