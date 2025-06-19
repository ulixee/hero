import IPoint from '@ulixee/unblocked-specification/agent/browser/IPoint';
export default function generateVector(startPoint: IPoint, destinationPoint: IPoint, targetWidth: number, minPoints: number, maxPoints: number, overshoot: {
    threshold: number;
    radius: number;
    spread: number;
}): IPoint[];
