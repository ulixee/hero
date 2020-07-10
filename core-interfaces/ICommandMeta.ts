export default interface ICommandMeta {
  id: number;
  frameId: number;
  name: string;
  args?: string;
  startDate: string;
  endDate?: string;
  result?: any;
  resultType?: string;
}
