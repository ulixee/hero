import IPoint from '@ulixee/unblocked-specification/agent/browser/IPoint';
export default class Bezier {
    private readonly points;
    private readonly derivativePoints;
    constructor(...points: IPoint[]);
    toString(): string;
    length(): number;
    getLookupTable(points?: number): IPoint[];
    static compute(t: number, points: IPointWithT[]): IPointWithT;
}
interface IPointWithT extends IPoint {
    t?: number;
}
export {};
