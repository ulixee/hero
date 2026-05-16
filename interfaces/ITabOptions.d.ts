export default interface ITabOptions {
    blockedResourceTypes?: IBlockedResourceType[];
    blockedResourceUrls?: (string | RegExp)[];
    interceptedResources?: InterceptedResource[];
}
export declare enum BlockedResourceType {
    JsRuntime = "JsRuntime",
    BlockJsResources = "BlockJsResources",
    BlockCssResources = "BlockCssResources",
    BlockImages = "BlockImages",
    BlockFonts = "BlockFonts",
    BlockIcons = "BlockIcons",
    BlockMedia = "BlockMedia",
    BlockAssets = "BlockAssets",
    All = "All",
    None = "None"
}
export interface InterceptedResource {
    url: string | RegExp;
    body?: string;
    statusCode?: number;
    headers?: {
        [key: string]: string;
    };
}
export type IBlockedResourceType = keyof typeof BlockedResourceType;
