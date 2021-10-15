export default interface IPageStateAssertionBatch {
  state: string;
  id: string;
  sessions: {
    sessionId: string;
    dbLocation: string; // could be on another machine
    tabId: number;
    timeRange: [start: number, end: number];
  }[];
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
