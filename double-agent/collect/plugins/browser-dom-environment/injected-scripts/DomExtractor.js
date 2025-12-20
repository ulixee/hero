function DomExtractor(selfName, pageMeta = {}) {
    const { saveToUrl, pageUrl, pageHost, pageName } = pageMeta;
    const skipProps = [
        'Fingerprint2',
        'pageQueue',
        'DomExtractor',
        'pageLoaded',
        'axios',
        'justAFunction',
    ];
    const skipValues = ['innerHTML', 'outerHTML', 'innerText', 'outerText'];
    const doNotInvoke = [
        'replaceChildren',
        'print',
        'alert',
        'prompt',
        'confirm',
        'open',
        'close',
        'reload',
        'assert',
        'requestPermission',
        'screenshot',
        'pageLoaded',
        'delete',
        'clear',
        'read',
        'start',
        'stop',
        'write',
        'writeln',
        'replaceWith',
        'remove',
        'self.history.back',
        'self.history.forward',
        'self.history.go',
        'self.history.pushState',
        'self.history.replaceState',
        'self.navigation.back',
        'self.navigation.forward',
        'self.navigation.go',
        'self.navigation.pushState',
        'self.navigation.replaceState',
        'getUserMedia',
        'requestFullscreen',
        'webkitRequestFullScreen',
        'webkitRequestFullscreen',
        'getDisplayMedia',
    ].map(x => x.replace(/self\./g, `${selfName}.`));
    const doNotAccess = [
        'document.body',
        'self.CSSAnimation.prototype.timeline',
        'self.Animation.prototype.timeline',
        'self.CSSTransition.prototype.timeline',
        `self.XRRigidTransform.new().matrix`,
        `self.XRRigidTransform.new().inverse`,
    ].map(x => x.replace(/self\./g, `${selfName}.`));
    const excludedInheritedKeys = ['name', 'length', 'constructor'];
    const loadedObjectsRef = new Map([[self, selfName]]);
    const loadedObjectsProp = new Map();
    const hierarchyNav = new Map();
    const detached = {};
    async function extractPropsFromObject(obj, parentPath) {
        const keys = [];
        let symbols = [];
        try {
            for (const key of Object.getOwnPropertyNames(obj)) {
                if (!keys.includes(key))
                    keys.push(key);
            }
        }
        catch (err) { }
        try {
            symbols = Object.getOwnPropertySymbols(obj);
            for (const key of symbols) {
                if (!keys.includes(key))
                    keys.push(key);
            }
        }
        catch (err) { }
        try {
            for (const key in obj) {
                if (!keys.includes(key))
                    keys.push(key);
            }
        }
        catch (err) { }
        const newObj = {
            _$protos: await loadProtoHierarchy(obj, parentPath),
        };
        if (parentPath.includes(`${selfName}.document.`) &&
            !parentPath.includes(`${selfName}.document.documentElement`) &&
            newObj._$protos.includes('HTMLElement.prototype')) {
            newObj._$skipped = 'SKIPPED ELEMENT';
            return newObj;
        }
        if (parentPath.includes('new()') && parentPath.endsWith('.ownerElement')) {
            newObj._$skipped = 'SKIPPED ELEMENT';
            return newObj;
        }
        if (parentPath.split('.').length >= 8) {
            newObj._$skipped = 'SKIPPED MAX DEPTH';
            return newObj;
        }
        const isNewObject = parentPath.includes('.new()');
        if (isNewObject && newObj._$protos[0] === 'HTMLDocument.prototype') {
            newObj._$skipped = 'SKIPPED DOCUMENT';
            newObj._$type = 'HTMLDocument.prototype';
            return newObj;
        }
        if (Object.isFrozen(obj))
            newObj._$isFrozen = true;
        if (Object.isSealed(obj))
            newObj._$isSealed = true;
        if (!newObj._$protos.length)
            delete newObj._$protos;
        const inheritedProps = [];
        if (isNewObject) {
            let proto = obj;
            while (proto) {
                proto = Object.getPrototypeOf(proto);
                if (!proto ||
                    proto === Object ||
                    proto === Object.prototype ||
                    proto === Function ||
                    proto === Function.prototype ||
                    proto === HTMLElement.prototype ||
                    proto === EventTarget.prototype)
                    break;
                for (const key of Object.getOwnPropertyNames(proto)) {
                    if (!keys.includes(key) && !excludedInheritedKeys.includes(key))
                        inheritedProps.push(key);
                }
            }
        }
        keys.push(...inheritedProps);
        for (const key of keys) {
            if (skipProps.includes(key)) {
                continue;
            }
            if (key === 'constructor')
                continue;
            const path = `${parentPath}.${String(key)}`;
            if (path.endsWith('_GLOBAL_HOOK__'))
                continue;
            const prop = `${String(key)}`;
            if (path.startsWith(`${selfName}.document`) &&
                typeof key === 'string' &&
                (key.startsWith('child') ||
                    key.startsWith('first') ||
                    key.startsWith('last') ||
                    key.startsWith('next') ||
                    key.startsWith('prev') ||
                    key === 'textContent' ||
                    key === 'text')) {
                newObj[prop] = { _$type: 'dom', _$skipped: 'SKIPPED DOM' };
                continue;
            }
            if (path.startsWith(`${selfName}.document`) && path.split('.').length > 5) {
                newObj[prop] = { _$type: 'object', _$skipped: 'SKIPPED DEPTH' };
                continue;
            }
            if (key === 'style') {
                if (isNewObject) {
                    newObj[prop] = { _$type: 'object', _$skipped: 'SKIPPED STYLE' };
                    continue;
                }
            }
            if (hierarchyNav.has(path)) {
                newObj[prop] = hierarchyNav.get(path);
                continue;
            }
            if (doNotAccess.includes(path)) {
                continue;
            }
            try {
                const isOwnProp = obj.hasOwnProperty && obj.hasOwnProperty(key) && !inheritedProps.includes(key);
                const value = await extractPropValue(obj, key, path, !isOwnProp);
                if (value && typeof value === 'string' && value.startsWith('REF:') && !isOwnProp) {
                    // don't assign here
                    // console.log('skipping ref', value);
                }
                else {
                    newObj[prop] = value;
                }
            }
            catch (err) {
                newObj[prop] = err.toString();
            }
        }
        if (obj.prototype) {
            let instance;
            let constructorException;
            try {
                instance = await new obj();
            }
            catch (err) {
                constructorException = err.toString();
            }
            if (constructorException) {
                newObj['new()'] = { _$type: 'constructor', _$constructorException: constructorException };
            }
            else {
                try {
                    newObj['new()'] = await extractPropsFromObject(instance, `${parentPath}.new()`);
                    newObj['new()']._$type = 'constructor';
                }
                catch (err) {
                    newObj['new()'] = err.toString();
                }
            }
        }
        return newObj;
    }
    async function loadProtoHierarchy(obj, parentPath) {
        const hierarchy = [];
        let proto = obj;
        if (typeof proto === 'function')
            return hierarchy;
        while (proto) {
            proto = Object.getPrototypeOf(proto);
            if (!proto)
                break;
            try {
                const name = getObjectName(proto);
                if (name && !hierarchy.includes(name))
                    hierarchy.push(name);
                if (loadedObjectsRef.has(proto))
                    continue;
                let path = `${selfName}.${name}`;
                const topType = name.split('.').shift();
                if (!(topType in self)) {
                    path = `detached.${name}`;
                }
                if (!hierarchyNav.has(path)) {
                    hierarchyNav.set(path, {});
                    const extracted = await extractPropsFromObject(proto, path);
                    hierarchyNav.set(path, extracted);
                    if (!path.includes(`${selfName}.`)) {
                        detached[name] = extracted;
                    }
                }
            }
            catch (err) { }
        }
        return hierarchy;
    }
    async function extractPropValue(obj, key, path, isInherited) {
        if (obj === null || obj === undefined || !key) {
            return undefined;
        }
        let accessException;
        const value = await new Promise(async (resolve, reject) => {
            let didResolve = false;
            // if you wait on a promise, it will hang!
            const t = setTimeout(() => reject('Likely a Promise'), 600);
            try {
                const p = await obj[key];
                if (didResolve)
                    return;
                didResolve = true;
                clearTimeout(t);
                resolve(p);
            }
            catch (err) {
                if (didResolve)
                    return;
                clearTimeout(t);
                reject(err);
            }
        }).catch(err => {
            accessException = err;
        });
        let ref;
        if (value &&
            path !== `${selfName}.document` &&
            (typeof value === 'function' || typeof value === 'object' || typeof value === 'symbol')) {
            if (loadedObjectsRef.has(value)) {
                ref = loadedObjectsRef.get(value);
                const shouldContinue = typeof value === 'function' &&
                    (isInherited || !path.replace(String(key), '').includes(String(key)));
                if (!shouldContinue)
                    return `REF: ${loadedObjectsRef.get(value)}`;
            }
            // safari will end up in an infinite loop since each plugin is a new object as your traverse
            if (path.includes('.navigator') && path.endsWith('.enabledPlugin')) {
                return `REF: ${selfName}.navigator.plugins.X`;
            }
            if (!loadedObjectsRef.has(value)) {
                loadedObjectsRef.set(value, path);
            }
        }
        let details = {};
        if (value && (typeof value === 'object' || typeof value === 'function')) {
            details = await extractPropsFromObject(value, path);
        }
        const descriptor = await getDescriptor(obj, key, accessException, path);
        if (!Object.keys(descriptor).length && !Object.keys(details).length)
            return undefined;
        const prop = Object.assign(details, descriptor);
        if (prop._$value === `REF: ${path}`) {
            prop._$value = undefined;
        }
        if (ref) {
            const baseProp = loadedObjectsProp.get(value);
            if (baseProp['_$invocation'] === prop._$invocation) {
                return;
            }
            let key = '_$otherInvocation';
            if (prop._$isAsync) {
                key += 'Async';
            }
            baseProp[`${key}.${path}`] = prop._$invocation;
            return;
        }
        loadedObjectsProp.set(value, prop);
        return prop;
    }
    async function getDescriptor(obj, key, accessException, path) {
        const objDesc = Object.getOwnPropertyDescriptor(obj, key);
        if (objDesc) {
            let value;
            try {
                value = objDesc.value;
                if (!value && !accessException) {
                    value = obj[key];
                }
            }
            catch (err) { }
            let type = typeof value;
            value = getJsonUsableValue(value, key);
            const functionDetails = await getFunctionDetails(value, obj, key, type, path);
            type = functionDetails.type;
            const flags = [];
            if (objDesc.configurable)
                flags.push('c');
            if (objDesc.enumerable)
                flags.push('e');
            if (objDesc.writable)
                flags.push('w');
            return {
                _$type: type,
                _$function: functionDetails.func,
                _$invocation: functionDetails.invocation,
                _$isAsync: functionDetails.isAsync,
                _$flags: flags.join(''),
                _$accessException: accessException ? accessException.toString() : undefined,
                _$value: value,
                _$get: objDesc.get ? objDesc.get.toString() : undefined,
                _$set: objDesc.set ? objDesc.set.toString() : undefined,
                _$getToStringToString: objDesc.get ? objDesc.get.toString.toString() : undefined,
                _$setToStringToString: objDesc.set ? objDesc.set.toString.toString() : undefined,
            };
        }
        const plainObject = {};
        if (accessException && String(accessException).includes('Likely a Promise')) {
            plainObject._$value = 'Likely a Promise';
        }
        else if (accessException)
            return plainObject;
        let value;
        try {
            value = obj[key];
        }
        catch (err) { }
        let type = typeof value;
        if (value && Array.isArray(value))
            type = 'array';
        const functionDetails = await getFunctionDetails(value, obj, key, type, path);
        plainObject._$type = functionDetails.type;
        plainObject._$value = getJsonUsableValue(value, key);
        plainObject._$function = functionDetails.func;
        plainObject._$invocation = functionDetails.invocation;
        plainObject._$isAsync = functionDetails.isAsync;
        return plainObject;
    }
    async function getFunctionDetails(value, obj, key, type, path) {
        let func;
        let invocation;
        let isAsync;
        if (type === 'undefined')
            type = undefined;
        if (type === 'function') {
            try {
                func = String(value);
            }
            catch (err) {
                func = err.toString();
            }
            try {
                if (!doNotInvoke.includes(key) && !doNotInvoke.includes(path) && !value.prototype) {
                    invocation = await new Promise(async (resolve, reject) => {
                        const c = setTimeout(() => reject('Promise-like'), 650);
                        let didReply = false;
                        try {
                            let answer = obj[key]();
                            if (answer && answer.on) {
                                answer.on('error', err => {
                                    console.log('Error', err, obj, key);
                                });
                            }
                            isAsync = answer instanceof Promise;
                            answer = await answer;
                            if (didReply)
                                return;
                            clearTimeout(c);
                            didReply = true;
                            resolve(answer);
                        }
                        catch (err) {
                            if (didReply)
                                return;
                            didReply = true;
                            clearTimeout(c);
                            reject(err);
                        }
                    });
                }
            }
            catch (err) {
                invocation = err ? err.toString() : err;
            }
        }
        return {
            type,
            func,
            invocation: func || invocation !== undefined ? getJsonUsableValue(invocation) : undefined,
            isAsync,
        };
    }
    function getJsonUsableValue(value, key) {
        if (key && skipValues.includes(key)) {
            return 'SKIPPED VALUE';
        }
        try {
            if (value && typeof value === 'symbol') {
                value = `${String(value)}`;
            }
            else if (value && (value instanceof Promise || typeof value.then === 'function')) {
                value = 'Promise';
            }
            else if (value && typeof value === 'object') {
                const values = [];
                if (loadedObjectsRef.has(value)) {
                    return `REF: ${loadedObjectsRef.get(value)}`;
                }
                if (value.join !== undefined) {
                    // is array
                    // eslint-disable-next-line guard-for-in
                    for (const prop in value) {
                        values.push(getJsonUsableValue(value[prop]));
                    }
                    return `[${values.join(',')}]`;
                }
                for (const prop in value) {
                    if (value.hasOwnProperty(prop)) {
                        values.push(`${prop}: ${getJsonUsableValue(value[prop])}`);
                    }
                }
                return `{${values.map(x => x.toString()).join(',')}}`;
            }
            else if (typeof value === 'function') {
                return value.toString();
            }
            else if (value && typeof value === 'string') {
                if (pageUrl) {
                    while (value.includes(pageUrl)) {
                        value = value.replace(pageUrl, '<URL>');
                    }
                }
                if (pageHost) {
                    while (value.includes(pageHost)) {
                        value = value.replace(pageHost, '<HOST>');
                    }
                }
                value = value.replace(/<url>:\d+:\d+/g, '<url>:<lines>');
            }
            else {
                return value;
            }
        }
        catch (err) {
            value = err.toString();
        }
        return value;
    }
    function getObjectName(obj) {
        if (obj === Object)
            return 'Object';
        if (obj === Object.prototype)
            return 'Object.prototype';
        try {
            if (typeof obj === 'symbol') {
                return `${String(obj)}`;
            }
        }
        catch (err) { }
        try {
            let name = obj[Symbol.toStringTag];
            if (!name) {
                try {
                    name = obj.name;
                }
                catch (err) { }
            }
            if (obj.constructor) {
                const constructorName = obj.constructor.name;
                if (constructorName &&
                    constructorName !== Function.name &&
                    constructorName !== Object.name) {
                    name = constructorName;
                }
            }
            if ('prototype' in obj) {
                name = obj.prototype[Symbol.toStringTag] || obj.prototype.name || name;
                if (name)
                    return name;
            }
            if (typeof obj === 'function') {
                if (name && name !== Function.name)
                    return name;
                return obj.constructor.name;
            }
            if (!name)
                return;
            return `${name}.prototype`;
        }
        catch (err) { }
    }
    async function runAndSave() {
        self.addEventListener('unhandledrejection', promiseRejectionEvent => {
            console.log(promiseRejectionEvent);
        });
        const props = await extractPropsFromObject(self, selfName);
        await fetch(saveToUrl, {
            method: 'POST',
            body: JSON.stringify({
                [selfName]: props,
                detached,
            }),
            headers: {
                'Content-Type': 'application/json',
                'Page-Name': pageName,
            },
        });
    }
    async function run(obj, parentPath, extractKeys = []) {
        const result = await extractPropsFromObject(obj, parentPath);
        if (extractKeys && extractKeys.length) {
            const extracted = {};
            for (const key of extractKeys) {
                extracted[key] = result[key];
            }
            return JSON.stringify({ window: extracted, windowKeys: Object.keys(result) });
        }
        // NOTE: need to stringify to make sure this transfers same as it will from a browser window
        return JSON.stringify({ window: result, detached });
    }
    this.run = run;
    this.runAndSave = runAndSave;
    return this;
}
module.exports = DomExtractor;
// # sourceMappingURL=DomExtractor.js.map
//# sourceMappingURL=DomExtractor.js.map