export default interface IPageStateAssertionBatch {
  id: string;
  assertions: [
    frameId: number,
    type: IAssertionAndResult['type'],
    args: IAssertionAndResult['args'],
    comparison: IAssertionAndResult['comparison'],
    result: IAssertionAndResult['result'],
  ][];
}

export interface IAssertionAndResult {
  key: string;
  type: 'resource' | 'xpath' | 'jspath' | 'url' | 'storage';
  args: any[];
  comparison: '===' | '!==' | '>=' | '>' | '<' | '<=';
  result: number | string | boolean;
}

export interface IAssertionCounts {
  total: number;
  dom?: number;
  resources?: number;
  urls?: number;
  storage?: number;
}
