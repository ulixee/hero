# UserProfile

> UserProfiles are "saved state" of a User that can be restored to later resume a session.

UserProfiles enable you to capture the full browser state of a user after performing a series of activities. You might use this to:
 - resume the state of a "logged-in" user
 - accumulate "usage" behavior for an ongoing profile
 - share browser profiles between Hero instances running on different machines

## Constructor

This "state" is not instantiated, but retrieved from an Hero instance: [hero.exportUserProfile()](/docs/hero/basic-client/hero#export-profile).

State is stored for all domains (origins) that are loaded into a window at the time of export. The exported state is JSON with additional type information for IndexedDB complex objects.

When you restore a UserProfile, Hero will restore the Cookies, Dom Storage and IndexedDB records for all domains that are included in the state.

```js
await hero.goto('https://dataliberationfoundation.org');
const theStoredProfile = await hero.exportUserProfile();

// ... some time later...

// This browser will be instantiated with all the cookies
// dom storage, etc from the prior session.

const heroWithProfile = new Hero({
  userProfile: theStoredProfile,
});
```

## Properties

### cookies

Cookies for all loaded "origins" for the browsing session.

#### **Type**: [`Cookie[]`](/docs/hero/advanced-client/cookie-storage#cookie)

### deviceProfile

An object containing hardware device properties emulated in this userProfile like memory and gpu information.

#### **Type**: `object`
  - deviceMemory `number`. The amount of memory specified for this machine
  - webGlParameters `object`. Key value of WebGlParameters to override (ie, { 37445: 'WebGl Vendor' })
  - videoDevice `object { deviceId: string, groupId: string }`. A video device to emulate if none is present, such as on a headless server.

### storage

An object with a key for each "security origin" of a page, and value all the associated [DomStorage](#dom-storage).

#### A `DomStorage` object contains: {#dom-storage}
  - localStorage `[key,value][]`. The `window.localStorage` entries for a given domain.
  - sessionStorage `[key,value][]`. The `window.sessionStorage` entries for a given domain.
  - indexedDB `IndexedDB[]`. An array of the `indexedDB` databases for a given domain with records stored as [typeson](https://github.com/dfahlander/typeson).
  
#### **Type**: `object { [origin: string]: DomStorage }`
  - key `string`. The "security origin" of a page or iFrame as defined by Chrome.
  - value [DomStorage](#dom-storage). The `DomStorage` entry for the given origin.

### userAgentString

The user agent used in this profile. Many sites that track user fingerprint information track the useragent information and expect it to remain the same. You can still override this (eg, to update a browser version) by overriding the `userAgent` parameter when constructing a new [`Agent`](/docs/hero/basic-client/agent).

#### **Type** string

