import IBridgeType from '../interfaces/IBridgeType';
export default function foreachBridgeSet(protocol: 'http' | 'https', bridge: [IBridgeType, IBridgeType], runFn: (key: string, dom1: any, dom2: any) => void): void;
