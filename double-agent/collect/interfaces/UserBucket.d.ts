declare enum UserBucket {
    IP = "IP Address",
    TLS = "TLS Fingerprint",
    Browser = "Cross-Session Browser Fingerprint",
    BrowserSingleSession = "Single-Session Browser Fingerprint",
    Font = "Fonts Fingerprint",
    IpAndPortRange = "IP Address & Port Range",
    UserAgent = "UserAgent",
    UserCookie = "UserCookie"
}
export declare function getUserBucket(type: string): UserBucket | null;
export default UserBucket;
