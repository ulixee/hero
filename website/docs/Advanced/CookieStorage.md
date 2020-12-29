# CookieStorage

The CookieStorage class allows you to get set and remove cookies from the main frame of the current tab. It mimics the W3C Storage api, but has slightly different parameters to deal with cookie settings.

## Constructor

CookieStorage cannot be instantiated. You must retrieve a cookieStorage instance from a [Tab](../basic-interfaces/tab):

```js
const cookieStorage = agent.activeTab.cookieStorage;
```

## Properties

### cookieStorage.length {#length}

Returns the number of cookies for the current tab origin;

#### **Type**: `Promise<number>`

## Methods

### cookieStorage.getItems*()*

Gets all cookies for the current tab origin as `Cookie` objects.

#### `Cookie` properties: {#cookie}
- name `string`. The cookie name.
- value `string`. The cookie value.
- domain `string`. The cookie domain.
- path `string`. The path for the cookie.
- expires `string`. An optional expiration date string.
- httpOnly `boolean`. Whether only accessible via http requests.
- session `boolean`. Whether the cookie should expire after the active session is over.
- secure `boolean`. Whether the cookie should only apply to https secured urls.
- sameSite `Strict | Lax | None`. The same site setting for the cookie.

#### **Returns**: [`Promise<Cookie[]>`](#cookie)

### cookieStorage.getItem*(keyName)*

Gets the cookie with the given `name` equal to `keyName`.

#### **Arguments**:

- keyName `string`. The cookie name to retrieve.

#### **Returns**: [`Promise<Cookie[]>`](#cookie)

### cookieStorage.key*(index)*

An integer representing the number of the key you want to get the name of. This is a zero-based index. NOTE: key is equivalent to the `name` of a cookie.

#### **Arguments**:

- index `number`. The key index.

#### **Returns**: `Promise<string>`

The function below calls a callback for each cookie key (or name).

```js
function forEachKey(callback) {
  for (var i = 0; i < cookieStorage.length; i++) {
    callback(cookieStorage.key(i));
  }
}
```

### cookieStorage.removeItem*(keyName)*

Removes a cookie with the given `keyName`.

#### **Arguments**:

- keyName `string`. The cookie name.

#### **Returns**: `Promise<boolean>`

### cookieStorage.setItem*(keyName, value, options)*

Sets a cookie for the currently loaded origin.

#### **Arguments**:

- keyName `string`. The cookie name.
- value `string`. The cookie value.
- expires `Data`. An optional expiration date for the cookie.
- options:
  - httpOnly `boolean`. Whether to set the cookie to be only accessible via http requests.
  - secure `boolean`. If the cookie should only apply to https secured urls.
  - sameSite `Strict | Lax | None`. The same site setting for the cookie.

#### **Returns**: `Promise<boolean>`
