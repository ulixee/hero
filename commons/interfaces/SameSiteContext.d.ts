declare const sameSiteContext: readonly ["none", "strict", "lax"];
type SameSiteContext = (typeof sameSiteContext)[number];
export declare function isSameSiteContext(type: string): boolean;
export default SameSiteContext;
