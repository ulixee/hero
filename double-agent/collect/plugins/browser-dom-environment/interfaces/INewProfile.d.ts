import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
type INewProfile = IBaseProfile<INewDomProfileData>;
export default INewProfile;
export interface INewDomProfileData {
    [path: string]: {
        _$protos?: string[];
        _$function?: string;
        _$flags?: IDomFlag[];
        _$accessException?: string;
        _constructorException?: string;
        _$get?: string;
        _$set?: string;
        _$getToStringToString?: string;
        _$setToStringToString?: string;
        _$type?: IDomType;
        _$value?: string;
        _$invocation?: string;
        _$skipped?: IDomSkipped;
    };
}
declare enum DomType {
    'object' = "object",
    'prototype' = "prototype",
    'number' = "number",
    'function' = "function",
    'string' = "string",
    'getter-setter' = "getter-setter",
    'getter' = "getter",
    'setter' = "setter",
    'ref' = "ref",
    'class' = "class",
    'constructor' = "constructor",
    'boolean' = "boolean",
    'array' = "array",
    'dom' = "dom",
    'symbol' = "symbol"
}
type IDomFlag = 'c' | 'e' | 'w';
export type IDomType = keyof typeof DomType;
type IDomSkipped = 'SKIPPED DOM' | 'SKIPPED STYLE' | 'SKIPPED ELEMENT' | 'SKIPPED DOCUMENT';
