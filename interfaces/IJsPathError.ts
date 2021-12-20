import { IPathStep } from 'awaited-dom/base/AwaitedPath';

export interface IJsPathError {
  error: string;
  pathState: {
    step: IPathStep;
    index: number;
    magicSelectorMatches?: number[];
  };
}
