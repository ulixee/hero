import { IPathStep } from './IJsPath';

export default interface IJsPathError {
  error: string;
  pathState: {
    step: IPathStep;
    index: number;
    querySelectorMatches?: number[];
  };
}
