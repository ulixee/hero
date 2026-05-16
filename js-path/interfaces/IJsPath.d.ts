declare type IJsPath = IPathStep[];
export default IJsPath;
export declare type IPathStep = IPropertyName | IMethod | INodeId;
export declare type IPropertyName = string;
export declare type INodeId = number;
export declare type IMethod = [IMethodName, ...IMethodArgs];
export declare type IMethodName = string;
export declare type IMethodArgs = any[];
