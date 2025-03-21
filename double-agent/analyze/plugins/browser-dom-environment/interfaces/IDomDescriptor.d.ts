type OtherInvocationInfo = `` | `Async`;
type OtherInvocationKey = `_$otherInvocation${OtherInvocationInfo}.${string}`;
export default interface IDomDescriptor {
    _$flags?: string;
    _$type?: string;
    _$get?: string;
    _$set?: string;
    _$ref?: string;
    _$accessException?: string;
    _$constructorException?: string;
    _$value?: string | number | boolean;
    _$getToStringToString?: string;
    _$setToStringToString?: string;
    _$function?: string;
    _$invocation?: string;
    _$isAsync?: string;
    [key: OtherInvocationKey]: string;
    _$protos?: string[];
    'new()'?: IDomDescriptor;
    prototype?: IDomDescriptor;
    _$functionMethods?: {
        [fnName: string]: IDomDescriptor;
    };
    _$keyOrder?: string[];
}
export {};
