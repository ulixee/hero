declare enum OriginType {
    None = "none",
    SameOrigin = "same-origin",
    SameSite = "same-site",
    CrossSite = "cross-site"
}
export declare function getOriginType(type: string): OriginType | null;
export default OriginType;
