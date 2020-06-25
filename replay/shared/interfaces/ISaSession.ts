export default interface ISaSession {
  id: string;
  scriptEntrypoint: string;
  scriptInstanceId: string;
  relatedScriptInstances: any[];
  ticks: ITick[];
  pages: any[];
}

interface ITick {
  playbarOffsetPercent: number;
  minorTicks: any[];
}
