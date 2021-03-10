# UserProfile

> UserProfiles are "saved state" of a User that can be restored to later resume a session.

UserProfiles enable you to capture the full browser state of a user after performing a series of activities. You might use this to:
 - resume the state of a "logged-in" user
 - accumulate "usage" behavior for an ongoing profile
 - share browser profiles between Agent instances running on different machines

## Constructor

This "state" is not instantiated, but retrieved from an Agent instance: [agent.exportUserProfile()](/docs/basic-interfaces/agent#export-profile).

State is stored for all domains (origins) that are loaded into a window at the time of export. The exported state is JSON with additional type information for IndexedDB ([typeson](https://github.com/dfahlander/typeson).

When you restore a UserProfile, SecretAgent will restore the Cookies, Dom Storage and IndexedDB records for all domains that are included in the state.

```js
await agent.goto('https://dataliberationfoundation.org');
const theStoredProfile = await agent.exportUserProfile();

// ... some time later...

// This browser will be instantiated with all the cookies
// dom storage, etc from the prior session.

const agentWithProfile = await handler.createAgent({
  userProfile: theStoredProfile,
});
```

## Properties

### cookies

Cookies for all loaded "origins" for the browsing session.

#### **Type**: [`Cookie[]`](/docs/advanced/cookie-storage#cookie)

### storage

An object with a key for each "security origin" of a page, and value all the associated [DomStorage](#dom-storage).

#### A `DomStorage` object contains: {#dom-storage}
  - localStorage `[key,value][]`. The `window.localStorage` entries for a given domain.
  - sessionStorage `[key,value][]`. The `window.sessionStorage` entries for a given domain.
  - indexedDB `IndexedDB[]`. An array of the `indexedDB` databases for a given domain with records stored as [typeson](https://github.com/dfahlander/typeson).
  
#### **Type**: `object { [origin: string]: DomStorage }`
  - key `string`. The "security origin" of a page or iFrame as defined by Chrome.
  - value [DomStorage](#dom-storage). The `DomStorage` entry for the given origin.
