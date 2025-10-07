import { IProfileData } from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
import IDomDescriptor from '../interfaces/IDomDescriptor';
export declare const metaKeys: Set<string>;
export interface IEndpoint {
    path: string;
    object: IDomDescriptor;
}
export declare const unknownMetaKeys: Set<string>;
export declare const metaValues: {
    [key: string]: Set<any>;
};
export default function extractDomEndpoints(dom: IProfileData): {
    [path: string]: IEndpoint;
};
