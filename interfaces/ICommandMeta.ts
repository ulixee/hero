export default interface ICommandMeta {
  id: number;
  tabId: number;
  frameId: number;
  name: string;
  wasPrefetched?: boolean;
  args?: string;
  startDate: number;
  endDate?: number;
  result?: any;
  resultType?: string;
}
