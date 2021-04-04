export default interface ICommandMeta {
  id: number;
  tabId: number;
  frameId: string;
  name: string;
  args?: string;
  startDate: number;
  endDate?: number;
  result?: any;
  resultType?: string;
}
