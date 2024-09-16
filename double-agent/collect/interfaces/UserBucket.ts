enum UserBucket {
  IP = 'IP Address',
  TLS = 'TLS Fingerprint',
  Browser = 'Cross-Session Browser Fingerprint',
  BrowserSingleSession = 'Single-Session Browser Fingerprint',
  Font = 'Fonts Fingerprint',
  IpAndPortRange = 'IP Address & Port Range',
  UserAgent = 'UserAgent',
  UserCookie = 'UserCookie',
}

const values = Object.values(UserBucket);
export function getUserBucket(type: string): UserBucket | null {
  if (values.includes(type as UserBucket)) return type as UserBucket;
  return null;
}

export default UserBucket;
