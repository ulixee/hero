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
  type: 'resource' | 'xpath' | 'jspath' | 'url';
  args: any[];
  comparison: '===' | '!==' | '>=' | '>' | '<' | '<=';
  result: number | string | boolean;
}
