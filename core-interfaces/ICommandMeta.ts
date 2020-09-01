export default interface ICommandMeta {
  id: number;
  frameId: string;
  name: string;
  args?: string;
  startDate: string;
  endDate?: string;
  result?: any;
  resultType?: string;
}
